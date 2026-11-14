import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  CreditCard,
  Search,
  Check,
  X,
  MapPin,
  Calendar,
  ChevronRight,
  TrendingDown,
  LogOut,
  ArrowLeft,
  PlusCircle,
  Plus,
  Image as ImageIcon,
  Phone,
  Trash2,
  UserPlus,
  BookOpen,
  Shield,
  Truck,
  Navigation,
  Briefcase,
  Settings,
  Database,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { IMAGES, resolvePaperImage } from '../../assets/images';
import { store } from '../../utils/store';
import { getAdminOverviewSnapshot, setAdminOverviewSnapshot, type AdminOverviewSnapshot } from '../../utils/session';
import { uploadNewspaperLogo, deleteImage, listenUsers, updateUser, deleteUser, saveUser } from '../../database';
import { cleanupOldScreenshots, getCleanupStats, getStorageUsage } from '../../database/cleanup';
import AdminVendorsTab from '../../components/AdminVendorsTab';
import AdminCustomerBillingModal from '../../components/AdminCustomerBillingModal';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'deliveries' | 'payments' | 'papers' | 'access' | 'vendors' | 'maintenance' | 'skipped'>('overview');
  const [search, setSearch] = useState('');
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [papersList, setPapersList] = useState(store.getPapers());
  const [adminNumbers, setAdminNumbers] = useState(store.getAdminNumbers());
  const [payments, setPayments] = useState(store.getPayments());
  const [usersList, setUsersList] = useState<any[]>([]);
  const [custFilter, setCustFilter] = useState<'all' | 'active' | 'present' | 'pending'>('all');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [selectedCustomerForBilling, setSelectedCustomerForBilling] = useState<any>(null);
  const [editingAliasCustomer, setEditingAliasCustomer] = useState<any>(null);
  const [aliasModalVisible, setAliasModalVisible] = useState(false);
  const [aliasText, setAliasText] = useState('');

  // Add Customer State
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Add Paper State
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newPaper, setNewPaper] = useState({ name: '', language: '', category: 'Paper' as 'Paper' | 'Magazine', priceDay: '', priceMonth: '', imageUrl: '' });

  // Edit Paper State
  const [isEditingPaper, setIsEditingPaper] = useState(false);
  const [isEditingUploading, setIsEditingUploading] = useState(false);
  const [editingPaper, setEditingPaper] = useState<{
    id: string;
    name: string;
    language: string;
    category: 'Paper' | 'Magazine';
    priceDay: string;
    priceMonth: string;
    rating: string;
    imageUrl: string;
    currentImageSrc: string;
  } | null>(null);

  // Add Agent State (Removed)
  const [prevOverview, setPrevOverview] = useState<AdminOverviewSnapshot | null>(null);
  const [paymentsMonth, setPaymentsMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone: string } | null>(null);
  const [isCustomerPaymentsOpen, setIsCustomerPaymentsOpen] = useState(false);
  const [isPaymentEditorOpen, setIsPaymentEditorOpen] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({
    amount: '',
    method: 'UPI',
    txnId: '',
    status: 'Paid' as 'Paid' | 'Pending',
    forMonth: '',
  });

  // Delivery Detail Modal
  const [selectedDelivery, setSelectedDelivery] = useState<typeof deliveries[0] | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  // Maintenance Tab State
  const [storageUsage, setStorageUsage] = useState({
    totalBills: 0,
    billsWithScreenshots: 0,
    totalPayments: 0,
    paymentsWithScreenshots: 0,
    estimatedSizeMB: 0,
  });
  const [cleanupStats, setCleanupStats] = useState({
    billsOlderThan30Days: 0,
    paymentsOlderThan30Days: 0,
    totalOldScreenshots: 0,
    storageToFreeMB: 0,
    cutoffDate: new Date(),
  });
  const [isCleaning, setIsCleaning] = useState(false);

  // Limit alerts
  // Firebase Storage: 5GB limit for screenshots
  const storagePercent = Math.round((storageUsage.estimatedSizeMB / 5000) * 100);
  const isStorageWarning = storagePercent > 70;
  const isStorageCritical = storagePercent > 90;

  // Firestore Database: 1GB limit for text data
  const dbUsageMB = Math.round((usersList.length * 4) / 1024); // ~4KB per user
  const dbPercent = Math.round((dbUsageMB / 1024) * 100);
  const isDbWarning = dbPercent > 70;
  const isDbCritical = dbPercent > 90;

  // Daily Reads: 50,000 limit
  const estimatedReads = Math.round(usersList.length * 7); // ~7 reads per user/day
  const readsPercent = Math.round((estimatedReads / 50000) * 100);
  const isReadsWarning = readsPercent > 70;
  const isReadsCritical = readsPercent > 90;

  // Daily Writes: 20,000 limit
  const estimatedWrites = Math.round(usersList.length * 3); // ~3 writes per user/day
  const writesPercent = Math.round((estimatedWrites / 20000) * 100);
  const isWritesWarning = writesPercent > 70;
  const isWritesCritical = writesPercent > 90;

  // Firebase Auth: 50,000 sign-ins/day limit (optional layer)
  const estimatedAuth = Math.round(usersList.length * 1); // ~1 auth per user/day
  const authPercent = Math.round((estimatedAuth / 50000) * 100);
  const isAuthWarning = authPercent > 70;
  const isAuthCritical = authPercent > 90;

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setDeliveries(store.getDeliveries());
      setPapersList(store.getPapers());
      setAdminNumbers(store.getAdminNumbers());
      setPayments(store.getPayments());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = listenUsers((docs) => setUsersList(docs as any[]));
    return unsubscribe;
  }, []);

  useEffect(() => {
    getAdminOverviewSnapshot().then(setPrevOverview).catch(() => { });
  }, []);

  // Load storage and cleanup stats when maintenance tab is active
  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadMaintenanceStats();
    }
  }, [activeTab]);

  const loadMaintenanceStats = async () => {
    try {
      const [usage, stats] = await Promise.all([
        getStorageUsage(),
        getCleanupStats(),
      ]);
      setStorageUsage(usage);
      setCleanupStats(stats);
    } catch (error) {
      console.error('[Admin] Error loading maintenance stats:', error);
    }
  };

  const handleCleanup = async () => {
    Alert.alert(
      'Confirm Cleanup',
      `This will delete ${cleanupStats.totalOldScreenshots} screenshots older than 30 days, freeing ~${cleanupStats.storageToFreeMB} MB. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsCleaning(true);
            try {
              const result = await cleanupOldScreenshots();
              Alert.alert(
                result.success ? 'Cleanup Complete' : 'Cleanup Finished',
                result.message,
                [{ text: 'OK' }]
              );
              // Reload stats
              await loadMaintenanceStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to run cleanup. Please try again.');
              console.error('[Admin] Cleanup error:', error);
            } finally {
              setIsCleaning(false);
            }
          },
        },
      ]
    );
  };


  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo Access Required',
          'We need permission to access your photo library so you can choose a newspaper logo. Please enable it in Settings.',
          [{ text: 'OK', style: 'default' }],
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewPaper({ ...newPaper, imageUrl: result.assets[0].uri });
      }
    } catch (e: any) {
      console.warn('[Admin] pickImage failed:', e);
      Alert.alert('Could Not Open Gallery', String(e?.message || e) || 'Please try again.', [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  const handleAddPaper = async () => {
    if (!newPaper.name || !newPaper.language || !newPaper.priceMonth) return;
    if (!newPaper.imageUrl) {
      Alert.alert('Image Required', 'Please select a publication logo from the gallery before saving.', [
        { text: 'OK', style: 'default' },
      ]);
      return;
    }
    setIsUploading(true);
    try {
      const imageSrc = newPaper.imageUrl
        ? await uploadNewspaperLogo(newPaper.imageUrl, newPaper.name)
        : '';
      if (!imageSrc) {
        throw new Error('Image upload returned an empty URL — check Firebase Storage rules or your internet connection.');
      }
      store.addPaper({
        name: newPaper.name,
        language: newPaper.language,
        category: newPaper.category,
        priceDay: newPaper.priceDay ? parseFloat(newPaper.priceDay) : 0,
        priceMonth: newPaper.priceMonth ? parseFloat(newPaper.priceMonth) : 0,
        imageKey: imageSrc,
      });
      setNewPaper({ name: '', language: '', category: 'Paper', priceDay: '', priceMonth: '', imageUrl: '' });
      setIsAddingPaper(false);
      Alert.alert('Published ✅', `"${newPaper.name}" has been added and is visible to all customers.`, [
        { text: 'Great', style: 'default' },
      ]);
    } catch (e: any) {
      console.warn('[Admin] Add paper / upload failed:', e);
      const msg = e?.code
        ? `${e.code}: ${e.message || 'Upload failed'}`
        : String(e?.message || e) || 'Something went wrong while uploading the image.';
      Alert.alert('Could Not Save Publication', msg, [
        { text: 'Try Again', style: 'default' },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    if (!newCustomer.phone.trim() || newCustomer.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!newCustomer.address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    try {
      await saveUser({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        address: newCustomer.address.trim(),
        isAdmin: false,
        customerKind: 'legacy',
        approvalStatus: 'approved',
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Customer added successfully!');
      setIsAddCustomerModalOpen(false);
      setNewCustomer({ name: '', phone: '', address: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to add customer. Phone number may already exist.');
    }
  };

  const openEditPaper = (paper: any) => {
    setEditingPaper({
      id: paper.id,
      name: paper.name ?? '',
      language: paper.language ?? '',
      category: paper.category ?? 'Paper',
      priceDay: paper.priceDay != null ? String(paper.priceDay) : '',
      priceMonth: paper.priceMonth != null ? String(paper.priceMonth) : '',
      rating: paper.rating != null ? String(paper.rating) : '4.5',
      imageUrl: '',
      currentImageSrc: (paper as any).imageSrc ?? '',
    });
    setIsEditingPaper(true);
  };

  const pickEditImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo Access Required',
          'We need permission to access your photo library so you can choose a newspaper logo. Please enable it in Settings.',
          [{ text: 'OK', style: 'default' }],
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0 && editingPaper) {
        setEditingPaper({ ...editingPaper, imageUrl: result.assets[0].uri });
      }
    } catch (e: any) {
      console.warn('[Admin] pickEditImage failed:', e);
      Alert.alert('Could Not Open Gallery', String(e?.message || e) || 'Please try again.', [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  const handleSaveEditPaper = async () => {
    if (!editingPaper) return;
    if (!editingPaper.name || !editingPaper.language || !editingPaper.priceMonth) return;
    const finalImage = editingPaper.imageUrl || editingPaper.currentImageSrc;
    if (!finalImage) {
      Alert.alert('Image Required', 'Please select a publication logo before saving.', [
        { text: 'OK', style: 'default' },
      ]);
      return;
    }
    setIsEditingUploading(true);
    try {
      let imageSrc = editingPaper.currentImageSrc;
      const oldCloudUrl =
        editingPaper.currentImageSrc && /^https?:\/\//i.test(editingPaper.currentImageSrc)
          ? editingPaper.currentImageSrc
          : null;

      if (editingPaper.imageUrl) {
        const uploaded = await uploadNewspaperLogo(editingPaper.imageUrl, editingPaper.name);
        if (!uploaded) {
          throw new Error('Image upload returned an empty URL — check Firebase Storage rules or your internet connection.');
        }
        imageSrc = uploaded;
        if (oldCloudUrl) {
          deleteImage(oldCloudUrl).catch(() => { });
        }
      }
      const ratingNum = parseFloat(editingPaper.rating);
      store.updatePaper(editingPaper.id, {
        name: editingPaper.name.trim(),
        language: editingPaper.language.trim(),
        category: editingPaper.category,
        priceDay: editingPaper.priceDay ? parseFloat(editingPaper.priceDay) : 0,
        priceMonth: editingPaper.priceMonth ? parseFloat(editingPaper.priceMonth) : 0,
        rating: isNaN(ratingNum) ? 4.5 : ratingNum,
        imageKey: imageSrc,
      });
      setIsEditingPaper(false);
      setEditingPaper(null);
      Alert.alert('Saved ✅', `"${editingPaper.name}" has been updated.`, [
        { text: 'OK', style: 'default' },
      ]);
    } catch (e: any) {
      console.warn('[Admin] Edit paper save failed:', e);
      const msg = e?.code
        ? `${e.code}: ${e.message || 'Save failed'}`
        : String(e?.message || e) || 'Something went wrong while saving.';
      Alert.alert('Could Not Save Changes', msg, [
        { text: 'Got It', style: 'default' },
      ]);
    } finally {
      setIsEditingUploading(false);
    }
  };

  const handleDeletePaper = () => {
    if (!editingPaper) return;
    Alert.alert(
      'Delete Publication?',
      `Are you sure you want to delete "${editingPaper.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (editingPaper.currentImageSrc && /^https?:\/\//i.test(editingPaper.currentImageSrc)) {
              deleteImage(editingPaper.currentImageSrc).catch(() => { });
            }
            store.deletePaper(editingPaper.id);
            setIsEditingPaper(false);
            setEditingPaper(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = () => {
    store.setUser(null);
    router.replace('/customer/login');
  };

  const exportDeliverySheets = async () => {
    if (!deliveries.length) {
      Alert.alert('No Deliveries', 'No delivery records found to export.');
      return;
    }
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Customer', 'Phone', 'Address', 'Publication', 'Time', 'Status', 'MonthlyPrice'],
      ...deliveries.map((d) => [
        d.name,
        d.phone ?? '',
        d.address,
        d.paperName,
        d.time,
        d.status,
        typeof d.priceMonth === 'number' && isFinite(d.priceMonth) ? d.priceMonth : '',
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    try {
      await Share.share({
        title: 'Delivery Sheet',
        message: csv,
      });
    } catch { }
  };

  const monthTitle = (key: string) => {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Math.max(0, Number(m) - 1), 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = paymentsMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    setPaymentsMonth(`${ny}-${nm}`);
  };

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '').slice(-10);

  const openCustomerPayments = (name: string, phone: string) => {
    setSelectedCustomer({ name, phone });
    setIsCustomerPaymentsOpen(true);
  };

  const openPaymentEditor = (customer: { name: string; phone: string }, amount?: number) => {
    setPaymentDraft({
      amount: amount != null ? String(Math.round(amount)) : '',
      method: 'UPI',
      txnId: '',
      status: 'Paid',
      forMonth: paymentsMonth,
    });
    setSelectedCustomer(customer);
    setIsCustomerPaymentsOpen(true);
    setIsPaymentEditorOpen(true);
  };

  const savePayment = () => {
    if (!selectedCustomer) return;
    const amt = Number(paymentDraft.amount);
    if (!isFinite(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid amount.');
      return;
    }
    const phone = normalizePhone(selectedCustomer.phone);
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Customer phone number is missing/invalid.');
      return;
    }
    store.addPayment({
      customerName: selectedCustomer.name,
      customerPhone: phone,
      amount: amt,
      method: paymentDraft.method.trim() || 'UPI',
      txnId: paymentDraft.txnId.trim(),
      status: paymentDraft.status,
      forMonth: paymentDraft.forMonth || paymentsMonth,
    });
    setIsPaymentEditorOpen(false);
    setIsCustomerPaymentsOpen(true);
    setPaymentDraft({ amount: '', method: 'UPI', txnId: '', status: 'Paid', forMonth: '' });
  };

  const totalCustomers = new Set(deliveries.map(d => d.name)).size;
  const activeSubs = deliveries.length;
  const totalMonthlyRevenue = deliveries.reduce(
    (sum, d) => sum + (typeof d.priceMonth === 'number' && isFinite(d.priceMonth) ? d.priceMonth : 0),
    0
  );
  
  // Calculate total subscription fees collected (₹50 per subscription)
  const subscriptionFeePerUser = 50;
  const totalSubscriptionFees = activeSubs * subscriptionFeePerUser;

  const computeChange = (current: number, previous: number | null | undefined) => {
    if (previous == null) return { label: null as string | null, trend: null as 'up' | 'down' | null };
    if (previous === 0) {
      if (current === 0) return { label: '0%', trend: null as 'up' | 'down' | null };
      return { label: 'New', trend: 'up' as const };
    }
    const diff = current - previous;
    const pct = (diff / previous) * 100;
    const abs = Math.abs(pct);
    const rounded = abs >= 10 ? Math.round(abs) : Math.round(abs * 10) / 10;
    const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
    const trend = pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : null;
    return { label: `${sign}${rounded}%`, trend };
  };

  const customerChange = computeChange(totalCustomers, prevOverview?.totalCustomers);
  const subsChange = computeChange(activeSubs, prevOverview?.activeSubs);
  const revenueChange = computeChange(totalMonthlyRevenue, prevOverview?.totalMonthlyRevenue);
  const subscriptionFeesChange = computeChange(totalSubscriptionFees, prevOverview?.totalSubscriptionFees);

  useEffect(() => {
    const snapshot: AdminOverviewSnapshot = {
      totalCustomers,
      activeSubs,
      totalMonthlyRevenue,
      totalSubscriptionFees,
      pendingCount: 0,
      capturedAt: Date.now(),
    };
    const t = setTimeout(() => {
      setAdminOverviewSnapshot(snapshot).catch(() => { });
    }, 800);
    return () => clearTimeout(t);
  }, [totalCustomers, activeSubs, totalMonthlyRevenue, totalSubscriptionFees]);

  const dynamicStats = [
    { label: 'Total Customers', value: totalCustomers.toString(), change: customerChange.label, trend: customerChange.trend, icon: Users, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Active Subs', value: activeSubs.toString(), change: subsChange.label, trend: subsChange.trend, icon: Check, bg: '#ECFDF5', color: '#059669' },
    { label: 'Monthly Revenue', value: `₹${totalMonthlyRevenue.toLocaleString('en-IN')}`, change: revenueChange.label, trend: revenueChange.trend, icon: DollarSign, bg: '#FEF2F2', color: '#DC2626' },
    { label: 'Subscription Fees', value: `₹${totalSubscriptionFees.toLocaleString('en-IN')}`, change: subscriptionFeesChange.label, trend: subscriptionFeesChange.trend, icon: CreditCard, bg: '#F0F9FF', color: '#0EA5E9' },
  ];

  const paymentCustomerRows = (() => {
    const byPhone = new Map<string, { name: string; phone: string; subs: typeof deliveries }>();
    for (const d of deliveries) {
      if (!d.phone) continue;
      const phone = normalizePhone(String(d.phone));
      if (phone.length !== 10) continue;
      const existing = byPhone.get(phone);
      if (existing) {
        existing.subs.push(d);
      } else {
        byPhone.set(phone, { name: d.name, phone, subs: [d] });
      }
    }

    const paidByPhone = new Map<string, number>();
    const pendingByPhone = new Map<string, number>();
    for (const p of payments) {
      if (p.forMonth !== paymentsMonth) continue;
      const phone = normalizePhone(String(p.customerPhone));
      if (phone.length !== 10) continue;
      const amt = typeof p.amount === 'number' && isFinite(p.amount) ? p.amount : 0;
      if (p.status === 'Paid') {
        paidByPhone.set(phone, (paidByPhone.get(phone) ?? 0) + amt);
      } else {
        pendingByPhone.set(phone, (pendingByPhone.get(phone) ?? 0) + amt);
      }
    }

    const rows = Array.from(byPhone.values()).map((c) => {
      const due = c.subs.reduce((sum, s) => sum + (typeof s.priceMonth === 'number' && isFinite(s.priceMonth) ? s.priceMonth : 0), 0);
      const paid = paidByPhone.get(c.phone) ?? 0;
      const balance = Math.max(0, due - paid);
      const status = balance <= 0 ? ('Paid' as const) : ('Pending' as const);
      return {
        name: c.name,
        phone: c.phone,
        subs: c.subs,
        due,
        paid,
        balance,
        status,
        pendingMarked: pendingByPhone.get(c.phone) ?? 0,
      };
    });

    rows.sort((a, b) => b.balance - a.balance);
    return rows;
  })();

  const selectedPhone = selectedCustomer ? normalizePhone(selectedCustomer.phone) : '';
  const selectedSubs = selectedPhone
    ? deliveries.filter((d) => d.phone && normalizePhone(String(d.phone)) === selectedPhone)
    : [];
  const selectedPayments = selectedPhone
    ? payments
      .filter((p) => normalizePhone(String(p.customerPhone)) === selectedPhone)
      .slice()
      .sort((a: any, b: any) => {
        const at = a?.createdAt?.seconds ?? 0;
        const bt = b?.createdAt?.seconds ?? 0;
        return bt - at;
      })
    : [];
  const selectedMonthPaid = selectedPhone
    ? payments
      .filter((p) => p.forMonth === paymentsMonth && p.status === 'Paid' && normalizePhone(String(p.customerPhone)) === selectedPhone)
      .reduce((sum, p) => sum + (typeof p.amount === 'number' && isFinite(p.amount) ? p.amount : 0), 0)
    : 0;
  const selectedMonthDue = selectedSubs.reduce(
    (sum, s) => sum + (typeof s.priceMonth === 'number' && isFinite(s.priceMonth) ? s.priceMonth : 0),
    0
  );
  const selectedMonthBalance = Math.max(0, selectedMonthDue - selectedMonthPaid);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Admin Control Center</Text>
          <Text style={styles.headerSubtitle}>Manage customers, routes & billing</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={14} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {([
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'customers', label: 'Customers', icon: UserPlus },
            { key: 'deliveries', label: 'Deliveries', icon: Truck },
            { key: 'payments', label: 'Payments', icon: CreditCard },
            { key: 'papers', label: 'Papers', icon: BookOpen },
            { key: 'vendors', label: 'Vendors', icon: Briefcase },
            { key: 'access', label: 'Access', icon: Shield },
            { key: 'maintenance', label: 'Maintenance', icon: Settings },
          ] as const).map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Icon
                    size={13}
                    color={isActive ? '#2563EB' : '#64748B'}
                    strokeWidth={2.2}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'vendors' && <AdminVendorsTab />}
        {activeTab === 'overview' && (
          <View style={styles.container}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {dynamicStats.map(stat => (
                <View key={stat.label} style={styles.statCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={[styles.statIconBox, { backgroundColor: stat.bg }]}>
                      <stat.icon size={20} color={stat.color} />
                    </View>
                    {stat.change ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        {stat.trend === 'up' ? (
                          <TrendingUp size={12} color="#10B981" />
                        ) : stat.trend === 'down' ? (
                          <TrendingDown size={12} color="#EF4444" />
                        ) : null}
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: stat.trend === 'up' ? '#10B981' : stat.trend === 'down' ? '#EF4444' : '#64748B',
                          }}
                        >
                          {stat.change}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}>—</Text>
                    )}
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Quick Actions Panel */}
            <Text style={styles.sectionTitle}>Admin Quick Tasks</Text>
            <View style={styles.actionPanel}>
              <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={exportDeliverySheets}>
                <View style={[styles.actionIndicator, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionName}>Export Delivery Sheets</Text>
                  <Text style={styles.actionDesc}>Share route sheet (CSV)</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => setActiveTab('payments')}>
                <View style={[styles.actionIndicator, { backgroundColor: '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionName}>Collect Outstanding Payments</Text>
                  <Text style={styles.actionDesc}>Open payments manager</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'customers' && (
          <View style={styles.container}>

            {(() => {
              const customersOnly = usersList.filter((u: any) => !u?.isAdmin);
              const presentCustomers = customersOnly.filter((u: any) => u?.customerKind !== 'legacy');
              const activeCustomers = customersOnly.filter((u: any) => u?.customerKind === 'legacy' && u?.approvalStatus === 'approved');
              const pendingLegacy = customersOnly.filter((u: any) => u?.customerKind === 'legacy' && u?.approvalStatus !== 'approved');

              const getInitials = (name: string) => {
                const parts = (name || 'C').trim().split(' ');
                return parts.length >= 2
                  ? (parts[0][0] + parts[1][0]).toUpperCase()
                  : parts[0].substring(0, 2).toUpperCase();
              };
              const avatarColors = [
                { bg: '#EFF6FF', text: '#2563EB' },
                { bg: '#F0FDF4', text: '#16A34A' },
                { bg: '#FFF7ED', text: '#EA580C' },
                { bg: '#FAF5FF', text: '#9333EA' },
                { bg: '#FFF1F2', text: '#E11D48' },
                { bg: '#F0F9FF', text: '#0284C7' },
              ];
              const getAvatarColor = (phone: string) => avatarColors[(phone?.length || 0) % avatarColors.length];

              // Determine which list to show based on filter
              let listToShow: any[] = [];
              if (custFilter === 'active') listToShow = activeCustomers;
              else if (custFilter === 'present') listToShow = presentCustomers;
              else if (custFilter === 'pending') listToShow = pendingLegacy;
              else listToShow = [...pendingLegacy, ...activeCustomers, ...presentCustomers];

              const filtered = listToShow.filter((u: any) =>
                (u?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (u?.phone || '').includes(search)
              );

              return (
                <>
                  {/* Compact Filter Chips */}
                  <View style={styles.custFilterRow}>
                    {([
                      { key: 'all', label: 'All', count: customersOnly.length, activeBg: '#0F172A', activeText: '#FFFFFF', dotColor: '#64748B' },
                      { key: 'active', label: 'Active', count: activeCustomers.length, activeBg: '#16A34A', activeText: '#FFFFFF', dotColor: '#16A34A' },
                      { key: 'present', label: 'Present', count: presentCustomers.length, activeBg: '#2563EB', activeText: '#FFFFFF', dotColor: '#2563EB' },
                      { key: 'pending', label: 'Pending', count: pendingLegacy.length, activeBg: '#F59E0B', activeText: '#FFFFFF', dotColor: '#F59E0B' },
                    ] as const).map(chip => {
                      const isActive = custFilter === chip.key;
                      return (
                        <TouchableOpacity
                          key={chip.key}
                          onPress={() => setCustFilter(chip.key)}
                          activeOpacity={0.75}
                          style={[
                            styles.custFilterChip,
                            isActive && { backgroundColor: chip.activeBg, borderColor: chip.activeBg },
                          ]}
                        >
                          <View style={[styles.custFilterDot, { backgroundColor: isActive ? chip.activeText : chip.dotColor }]} />
                          <Text style={[styles.custFilterText, isActive && { color: chip.activeText }]}>{chip.label}</Text>
                          <Text style={[styles.custFilterCount, isActive && { color: chip.activeText, opacity: 0.8 }]}>{chip.count}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Search Bar */}
                  <View style={styles.searchBox}>
                    <Search size={15} color="#94A3B8" />
                    <TextInput
                      placeholder="Search by name or phone..."
                      placeholderTextColor="#94A3B8"
                      value={search}
                      onChangeText={setSearch}
                      style={styles.searchInput}
                    />
                    {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                        <X size={15} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Add Customer Button */}
                  <TouchableOpacity
                    style={styles.addCustomerBtn}
                    onPress={() => setIsAddCustomerModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addCustomerBtnText}>Add Customer</Text>
                  </TouchableOpacity>

                  {/* Customer List */}
                  {filtered.length === 0 ? (
                    <View style={styles.custEmptyBox}>
                      <Users size={24} color="#CBD5E1" />
                      <Text style={styles.custEmptyTitle}>No customers found</Text>
                      <Text style={styles.custEmptySub}>Try a different filter or search term</Text>
                    </View>
                  ) : (
                    filtered.map((u: any) => {
                      const ac = getAvatarColor(u.phone);
                      const isPending = u?.customerKind === 'legacy' && u?.approvalStatus !== 'approved';
                      const isActive = u?.customerKind === 'legacy' && u?.approvalStatus === 'approved';
                      const isRejected = u?.approvalStatus === 'rejected';
                      const accentColor = isActive ? '#16A34A' : isRejected ? '#EF4444' : isPending ? '#F59E0B' : '#2563EB';
                      const displayName = u?.alias || u?.name || 'Customer';

                      return (
                        <TouchableOpacity
                          key={u.phone}
                          style={[styles.custCardPremium, { borderLeftWidth: 3, borderLeftColor: accentColor }]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedCustomerForBilling(u)}
                          onLongPress={() => {
                            Alert.alert(
                              'Delete Customer',
                              `Are you sure you want to delete ${displayName} (${u.phone})? This will permanently remove all their data including bills, payments, and delivery history. This action cannot be undone.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await deleteUser(u.phone);
                                      Alert.alert('Deleted', `${displayName} has been permanently deleted.`);
                                    } catch (e: any) {
                                      Alert.alert('Error', 'Failed to delete customer. Please try again.');
                                      console.error('[Admin] Delete user error:', e);
                                    }
                                  },
                                },
                              ],
                              { cancelable: true }
                            );
                          }}
                        >
                          <View style={[styles.custAvatar, { backgroundColor: ac.bg }]}>
                            <Text style={[styles.custAvatarText, { color: ac.text }]}>{getInitials(u.name || 'C')}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingAliasCustomer(u);
                                setAliasText(u?.alias || '');
                                setAliasModalVisible(true);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.custName}>{displayName}</Text>
                              {u?.alias && u?.alias !== u?.name && (
                                <Text style={styles.custAlias}>({u.name})</Text>
                              )}
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                              <Phone size={9} color="#CBD5E1" />
                              <Text style={styles.custMeta}>{u.phone}</Text>
                            </View>
                            {isPending && (
                              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                                <TouchableOpacity
                                  style={styles.approveBtn}
                                  activeOpacity={0.85}
                                  onPress={() => updateUser(u.phone, { customerKind: 'legacy', approvalStatus: 'approved' } as any)}
                                >
                                  <Check size={10} color="#FFFFFF" />
                                  <Text style={styles.approveBtnText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.rejectBtn}
                                  activeOpacity={0.85}
                                  onPress={() => {
                                    Alert.alert(
                                      'Reject Customer',
                                      `Are you sure you want to reject and remove ${u.name} from the customer list? This action cannot be undone.`,
                                      [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                          text: 'Reject & Remove',
                                          style: 'destructive',
                                          onPress: () => deleteUser(u.phone).then(() => {
                                            Alert.alert('Removed', `${u.name} has been removed from the customer list.`);
                                          }).catch((e) => {
                                            Alert.alert('Error', 'Failed to remove customer. Please try again.');
                                            console.error('[Admin] Delete user error:', e);
                                          })
                                        },
                                      ],
                                      { cancelable: true }
                                    );
                                  }}
                                >
                                  <X size={10} color="#EF4444" />
                                  <Text style={styles.rejectBtnText}>Reject</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 6 }}>
                            {isActive && (
                              <View style={[styles.statusPill, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                                <Text style={[styles.statusPillText, { color: '#15803D' }]}>✓ Active</Text>
                              </View>
                            )}
                            {!isActive && !isPending && (
                              <View style={[styles.statusPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                                <Text style={[styles.statusPillText, { color: '#1D4ED8' }]}>● New</Text>
                              </View>
                            )}
                            {isPending && !isRejected && (
                              <View style={[styles.statusPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                                <Text style={[styles.statusPillText, { color: '#92400E' }]}>⏳ Pending</Text>
                              </View>
                            )}
                            {isRejected && (
                              <View style={[styles.statusPill, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Text style={[styles.statusPillText, { color: '#DC2626' }]}>✕ Rejected</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.callBtn}
                              activeOpacity={0.8}
                              onPress={() => Linking.openURL(`tel:${u.phone}`)}
                            >
                              <Phone size={13} color="#2563EB" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </>
              );
            })()}
          </View>
        )}

        {/* Alias Edit Modal */}
        <Modal visible={aliasModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Customer Alias</Text>
              <Text style={styles.modalSubtitle}>
                Add an easy-to-remember alias for {editingAliasCustomer?.name || 'this customer'}
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., John - Red Gate House"
                placeholderTextColor="#94A3B8"
                value={aliasText}
                onChangeText={setAliasText}
              />
              
              <Text style={styles.modalHint}>
                Tip: Add location or landmark to help identify customers easily
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setAliasModalVisible(false);
                    setEditingAliasCustomer(null);
                    setAliasText('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={() => {
                    if (editingAliasCustomer) {
                      updateUser(editingAliasCustomer.phone, { alias: aliasText.trim() || null } as any);
                      setAliasModalVisible(false);
                      setEditingAliasCustomer(null);
                      setAliasText('');
                      Alert.alert('Saved', 'Customer alias has been updated.');
                    }
                  }}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Customer Modal */}
        <Modal visible={isAddCustomerModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <Text style={styles.modalSubtitle}>
                Add a customer from your previous system
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={newCustomer.name}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, name: text })}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number (10 digits)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={10}
                value={newCustomer.phone}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, phone: text })}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Delivery Address"
                placeholderTextColor="#94A3B8"
                value={newCustomer.address}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, address: text })}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setIsAddCustomerModalOpen(false);
                    setNewCustomer({ name: '', phone: '', address: '' });
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleAddCustomer}
                >
                  <Text style={styles.modalSaveText}>Add Customer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {activeTab === 'deliveries' && (
          <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Search size={18} color="#94A3B8" />
              <TextInput
                placeholder="Search customers or papers..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Compact Delivery List */}
            <Text style={styles.sectionTitle}>Today's Logs</Text>
            {deliveries
              .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.paperName.toLowerCase().includes(search.toLowerCase()))
              .map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#FFFFFF', borderRadius: 14,
                    padding: 12, marginBottom: 8,
                    borderWidth: 1, borderColor: '#F1F5F9',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                  }}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDelivery(item)}
                >
                  {/* Paper thumbnail */}
                  <View style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                    <Image source={item.src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 1 }} numberOfLines={1}>{item.paperName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <MapPin size={10} color="#94A3B8" />
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </View>

                  {/* Fee paid indicator + status + arrow */}
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {item.paymentMethod && (
                      <View style={{ backgroundColor: '#ECFDF5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>₹50 Paid</Text>
                      </View>
                    )}
                    <ChevronRight size={14} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* ── Delivery Detail Modal ── */}
        <Modal
          visible={selectedDelivery !== null}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedDelivery(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <TouchableOpacity onPress={() => setSelectedDelivery(null)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                <ArrowLeft size={18} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{selectedDelivery?.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Order Details</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Paper Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E2E8F0' }}>
                  <Image source={selectedDelivery?.src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{selectedDelivery?.paperName}</Text>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 }}>{selectedDelivery?.plan || 'Monthly'} Plan  •  ₹{selectedDelivery?.priceMonth}/mo</Text>
                </View>
              </View>

              {/* Details Grid */}
              {[
                { label: 'Customer Name', value: selectedDelivery?.name },
                { label: 'Phone', value: selectedDelivery?.phone || '—' },
                { label: 'Address', value: selectedDelivery?.address },
                { label: 'Delivery Days', value: selectedDelivery?.days?.map(d => d.slice(0, 3)).join(', ') || '—' },
                { label: 'Start Date', value: selectedDelivery?.startDate || '—' },
                { label: 'Order Fee (₹50)', value: selectedDelivery?.paymentMethod ? `Paid via ${selectedDelivery.paymentMethod}` : '—' },
                { label: 'Delivery Time', value: selectedDelivery?.time || '5:30 AM' },
              ].map(row => (
                <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>{row.label}</Text>
                  <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 16 }}>{row.value}</Text>
                </View>
              ))}

              {/* Home Location Photo & Directions */}
              {(selectedDelivery?.homeImageUri || selectedDelivery?.location) && (
                <View style={{ marginTop: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <MapPin size={14} color="#2563EB" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginLeft: 6 }}>Delivery Location</Text>
                  </View>

                  {selectedDelivery.homeImageUri && (
                    <TouchableOpacity onPress={() => setShowFullImage(true)} activeOpacity={0.9} style={{ marginBottom: 12 }}>
                      <Image
                        source={{ uri: selectedDelivery.homeImageUri }}
                        style={{ width: '100%', height: 220, borderRadius: 14, backgroundColor: '#F1F5F9' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Tap to view full</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedDelivery.location && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#2563EB',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        gap: 8,
                        shadowColor: '#2563EB',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.25,
                        shadowRadius: 6,
                        elevation: 4,
                        marginTop: 4,
                        marginBottom: 4
                      }}
                      onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedDelivery.location!.lat},${selectedDelivery.location!.lng}`)}
                      activeOpacity={0.85}
                    >
                      <Navigation size={16} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Get Directions</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ── Full Screen Image Viewer ── */}
        <Modal
          visible={showFullImage}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowFullImage(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }}
              onPress={() => setShowFullImage(false)}
            >
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {selectedDelivery?.homeImageUri && (
              <Image
                source={{ uri: selectedDelivery.homeImageUri }}
                style={{ width: '100%', height: '80%' }}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>

        {activeTab === 'payments' && (
          <View style={styles.container}>
            <View style={styles.paymentsHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Payments</Text>
                <Text style={styles.paymentsSub}>{monthTitle(paymentsMonth)}</Text>
              </View>
              <View style={styles.monthNav}>
                <TouchableOpacity style={styles.monthNavBtn} onPress={() => shiftMonth(-1)} activeOpacity={0.8}>
                  <Text style={styles.monthNavText}>Prev</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.monthNavBtn} onPress={() => shiftMonth(1)} activeOpacity={0.8}>
                  <Text style={styles.monthNavText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#94A3B8" />
              <TextInput
                placeholder="Search customer name / phone..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Pending Screenshot Payments */}
            {payments.filter((p) => (p as any).screenshotUrl && p.status === 'Pending').length > 0 && (
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
                <Text style={{ fontWeight: '800', color: '#92400E', fontSize: 13, marginBottom: 8 }}>
                  ⏳ {payments.filter((p) => (p as any).screenshotUrl && p.status === 'Pending').length} Payment Screenshot(s) Awaiting Review
                </Text>
                {payments
                  .filter((p) => (p as any).screenshotUrl && p.status === 'Pending')
                  .map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => openCustomerPayments(p.customerName, p.customerPhone)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0F172A' }}>{p.customerName}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>₹{p.amount} • {p.forMonth}</Text>
                      </View>
                      <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                        <Text style={{ color: '#1D4ED8', fontWeight: '700', fontSize: 11 }}>Review →</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            {paymentCustomerRows
              .filter((r) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                const digits = q.replace(/\D/g, '');
                return (
                  r.name.toLowerCase().includes(q) ||
                  (digits.length ? r.phone.includes(digits) : false)
                );
              })
              .map((r) => (
                <TouchableOpacity
                  key={r.phone}
                  style={styles.paymentCustomerRow}
                  activeOpacity={0.85}
                  onPress={() => openCustomerPayments(r.name, r.phone)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentCustomerName}>{r.name}</Text>
                    <Text style={styles.paymentCustomerMeta} numberOfLines={1}>
                      +91 {r.phone}  •  {r.subs.length} subs
                    </Text>
                    <Text style={styles.paymentCustomerMeta} numberOfLines={1}>
                      Due ₹{Math.round(r.due).toLocaleString('en-IN')}  •  Paid ₹{Math.round(r.paid).toLocaleString('en-IN')}  •  Balance ₹{Math.round(r.balance).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View style={[styles.payStatusPill, r.status === 'Paid' ? styles.payStatusPaid : styles.payStatusPending]}>
                      <Text style={[styles.payStatusText, r.status === 'Paid' ? styles.payStatusTextPaid : styles.payStatusTextPending]}>
                        {r.status}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addPayBtn}
                      onPress={() => openPaymentEditor({ name: r.name, phone: r.phone }, r.balance > 0 ? r.balance : undefined)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addPayBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

            {paymentCustomerRows.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateTitle}>No subscriptions yet</Text>
                <Text style={styles.emptyStateSub}>Once customers subscribe, they will appear here for payment tracking.</Text>
              </View>
            ) : null}
          </View>
        )}

        {activeTab === 'papers' && (
          <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Manage Publications</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 }}>
                  {papersList.filter(p => p.category === 'Paper').length} Papers • {papersList.filter(p => p.category === 'Magazine').length} Magazines
                </Text>
              </View>
              <TouchableOpacity style={styles.addPaperBtn} onPress={() => setIsAddingPaper(true)}>
                <PlusCircle size={16} color="#FFFFFF" />
                <Text style={styles.addPaperBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {(['Paper', 'Magazine'] as const).map((cat) => {
              const catItems = papersList.filter(p => p.category === cat);
              if (catItems.length === 0) return null;

              const languages = Array.from(new Set(catItems.map(p => p.language)));

              return (
                <View key={cat} style={{ marginBottom: 20 }}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryDot, { backgroundColor: cat === 'Paper' ? '#2563EB' : '#9333EA' }]} />
                    <Text style={styles.categoryTitle}>{cat === 'Paper' ? '📰 NEWSPAPERS' : '📚 MAGAZINES'}</Text>
                    <Text style={styles.categoryCount}>{catItems.length}</Text>
                  </View>

                  {languages.map(lang => {
                    const langItems = catItems.filter(p => p.language === lang);
                    return (
                      <View key={lang} style={{ marginBottom: 12 }}>
                        <View style={styles.languageHeader}>
                          <Text style={styles.languageName}>{lang}</Text>
                          <View style={styles.languageBadge}>
                            <Text style={styles.languageBadgeText}>{langItems.length}</Text>
                          </View>
                        </View>

                        {langItems.map((paper) => (
                          <View key={paper.id} style={styles.paperCatalogItem}>
                            <View style={[
                              styles.paperImageBox,
                              !paper.src && { borderWidth: 2, borderStyle: 'dashed', borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
                              { backgroundColor: !paper.src ? '#FEF2F2' : (cat === 'Paper' ? '#EFF6FF' : '#FAF5FF') }
                            ]}>
                              {paper.src ? (
                                <Image source={paper.src} style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }} resizeMode="cover" />
                              ) : (
                                <View style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}>
                                  <ImageIcon size={18} color="#EF4444" />
                                </View>
                              )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.custName}>{paper.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'wrap', gap: 8 }}>
                                <Text style={[
                                  styles.langChip,
                                  { backgroundColor: cat === 'Paper' ? '#EFF6FF' : '#FAF5FF', color: cat === 'Paper' ? '#2563EB' : '#9333EA' }
                                ]}>
                                  {lang}
                                </Text>
                                <Text style={styles.custAddress}>
                                  {paper.priceDay > 0 ? `₹${paper.priceDay}/day` : ''}
                                  {paper.priceDay > 0 && paper.priceMonth > 0 ? ' • ' : ''}
                                  {paper.priceMonth > 0 ? `₹${paper.priceMonth}/mo` : ''}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={() => openEditPaper(paper)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'access' && (
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Manage Admin Access</Text>

            <View style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
              <Text style={[styles.inputLabel, { marginBottom: 4 }]}>Admin Name</Text>
              <TextInput
                style={[styles.modalInput, { paddingVertical: 10, marginBottom: 12 }]}
                placeholder="e.g. Akhil KS"
                value={newAdminName}
                onChangeText={setNewAdminName}
              />

              <Text style={[styles.inputLabel, { marginBottom: 4 }]}>Mobile Number</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, paddingVertical: 10, marginBottom: 0 }]}
                  placeholder="Enter 10-digit phone"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={newAdminPhone}
                  onChangeText={setNewAdminPhone}
                />
                <TouchableOpacity
                  style={[styles.addPaperBtn, { borderRadius: 12, height: 46 }]}
                  onPress={() => {
                    if (newAdminPhone.length === 10 && newAdminName.trim().length > 0) {
                      store.addAdminNumber(newAdminPhone, newAdminName.trim());
                      setNewAdminPhone('');
                      setNewAdminName('');
                    }
                  }}
                >
                  <PlusCircle size={16} color="#FFFFFF" />
                  <Text style={styles.addPaperBtnText}>Add Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            {adminNumbers.map(admin => {
              const isPermanent = admin.phone === '9972505709' || admin.phone === '8123363394';
              return (
                <View key={admin.phone} style={styles.paperCatalogItem}>
                  <View style={[styles.paperLogoBox, { backgroundColor: '#F1F5F9', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }]}>
                    <Users size={20} color="#64748B" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.custName}>{admin.name || 'Admin User'}</Text>
                    <Text style={styles.custAddress}>+91 {admin.phone} {isPermanent ? '• Owner' : ''}</Text>
                  </View>
                  {!isPermanent ? (
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}
                      onPress={() => store.removeAdminNumber(admin.phone)}
                    >
                      <Text style={[styles.editBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.editBtn, { backgroundColor: '#F8FAFC' }]}>
                      <Text style={[styles.editBtnText, { color: '#94A3B8' }]}>Locked</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'maintenance' && (
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Database Maintenance</Text>

            {/* Firebase Storage Usage (Screenshots) */}
            <View style={[
              { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
              isStorageCritical && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              isStorageWarning && !isStorageCritical && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Database size={20} color={isStorageCritical ? '#DC2626' : isStorageWarning ? '#D97706' : '#2563EB'} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>Firebase Storage (Screenshots)</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[
                    { fontSize: 24, fontWeight: '700', color: '#2563EB' },
                    isStorageCritical && { color: '#DC2626' },
                    isStorageWarning && !isStorageCritical && { color: '#D97706' }
                  ]}>{storageUsage.estimatedSizeMB} MB</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>of 5,000 MB (5GB) free tier</Text>
                </View>
                <View style={[
                  { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
                  isStorageCritical && { backgroundColor: '#FECACA' },
                  isStorageWarning && !isStorageCritical && { backgroundColor: '#FDE68A' }
                ]}>
                  <Text style={[
                    { fontSize: 12, fontWeight: '600', color: '#2563EB' },
                    isStorageCritical && { color: '#DC2626' },
                    isStorageWarning && !isStorageCritical && { color: '#D97706' }
                  ]}>{storagePercent}%</Text>
                </View>
              </View>
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                {isStorageCritical ? (
                  <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '500' }}>
                    ⚠️ CRITICAL: Only ~{Math.round((5000 - storageUsage.estimatedSizeMB) / 0.3)} screenshots remaining. Run cleanup now!
                  </Text>
                ) : isStorageWarning ? (
                  <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '500' }}>
                    ⚠️ WARNING: ~{Math.round((5000 - storageUsage.estimatedSizeMB) / 0.3)} screenshots remaining. Consider cleanup soon.
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '500' }}>
                    ✅ You can still store ~{Math.round((5000 - storageUsage.estimatedSizeMB) / 0.3)} more screenshots
                  </Text>
                )}
              </View>
            </View>

            {/* User Usage Stats */}
            <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Users size={20} color="#2563EB" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>User Usage</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Total Users</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B' }}>{usersList.length}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Total Bills</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B' }}>{storageUsage.totalBills}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Total Payments</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B' }}>{storageUsage.totalPayments}</Text>
                </View>
              </View>
            </View>

            {/* Screenshot Stats */}
            <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <ImageIcon size={20} color="#2563EB" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>Screenshots</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Bills with screenshots</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B' }}>{storageUsage.billsWithScreenshots}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Payments with screenshots</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B' }}>{storageUsage.paymentsWithScreenshots}</Text>
                </View>
              </View>
            </View>

            {/* Firestore Database Usage */}
            <View style={[
              { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
              isDbCritical && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              isDbWarning && !isDbCritical && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <FileText size={20} color={isDbCritical ? '#DC2626' : isDbWarning ? '#D97706' : '#2563EB'} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>Firestore Database</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Est. Size</Text>
                  <Text style={[
                    { fontSize: 18, fontWeight: '600', color: '#2563EB' },
                    isDbCritical && { color: '#DC2626' },
                    isDbWarning && !isDbCritical && { color: '#D97706' }
                  ]}>{dbUsageMB} MB</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>of 1,024 MB</Text>
                  <Text style={[
                    { fontSize: 18, fontWeight: '600', color: '#10B981' },
                    isDbCritical && { color: '#DC2626' },
                    isDbWarning && !isDbCritical && { color: '#D97706' }
                  ]}>{dbPercent}%</Text>
                </View>
              </View>
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                {isDbCritical ? (
                  <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '500' }}>
                    ⚠️ CRITICAL: Database approaching 1GB limit
                  </Text>
                ) : isDbWarning ? (
                  <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '500' }}>
                    ⚠️ WARNING: Database usage at {dbPercent}%
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '500' }}>
                    ✅ Database usage healthy (~{1024 - dbUsageMB} MB remaining)
                  </Text>
                )}
              </View>
            </View>

            {/* Daily Operations */}
            <View style={[
              { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
              (isReadsCritical || isWritesCritical) && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              ((isReadsWarning || isWritesWarning) && !(isReadsCritical || isWritesCritical)) && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TrendingUp size={20} color={(isReadsCritical || isWritesCritical) ? '#DC2626' : (isReadsWarning || isWritesWarning) ? '#D97706' : '#2563EB'} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>Daily Operations</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Reads</Text>
                  <Text style={[
                    { fontSize: 16, fontWeight: '600', color: '#1E293B' },
                    isReadsCritical && { color: '#DC2626' },
                    isReadsWarning && !isReadsCritical && { color: '#D97706' }
                  ]}>{estimatedReads}/50,000</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Writes</Text>
                  <Text style={[
                    { fontSize: 16, fontWeight: '600', color: '#1E293B' },
                    isWritesCritical && { color: '#DC2626' },
                    isWritesWarning && !isWritesCritical && { color: '#D97706' }
                  ]}>{estimatedWrites}/20,000</Text>
                </View>
              </View>
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                {(isReadsCritical || isWritesCritical) ? (
                  <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '500' }}>
                    ⚠️ CRITICAL: Only {Math.round(50000 - estimatedReads)} reads & {Math.round(20000 - estimatedWrites)} writes remaining today
                  </Text>
                ) : (isReadsWarning || isWritesWarning) ? (
                  <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '500' }}>
                    ⚠️ WARNING: {Math.round(50000 - estimatedReads)} reads & {Math.round(20000 - estimatedWrites)} writes remaining today
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '500' }}>
                    ✅ {Math.round(50000 - estimatedReads)} reads & {Math.round(20000 - estimatedWrites)} writes remaining today
                  </Text>
                )}
              </View>
            </View>

            {/* Firebase Auth */}
            <View style={[
              { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
              isAuthCritical && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              isAuthWarning && !isAuthCritical && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Shield size={20} color={isAuthCritical ? '#DC2626' : isAuthWarning ? '#D97706' : '#2563EB'} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>Firebase Auth</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[
                    { fontSize: 24, fontWeight: '700', color: '#2563EB' },
                    isAuthCritical && { color: '#DC2626' },
                    isAuthWarning && !isAuthCritical && { color: '#D97706' }
                  ]}>{estimatedAuth}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>of 50,000 daily sign-ins</Text>
                </View>
                <View style={[
                  { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
                  isAuthCritical && { backgroundColor: '#FECACA' },
                  isAuthWarning && !isAuthCritical && { backgroundColor: '#FDE68A' }
                ]}>
                  <Text style={[
                    { fontSize: 12, fontWeight: '600', color: '#2563EB' },
                    isAuthCritical && { color: '#DC2626' },
                    isAuthWarning && !isAuthCritical && { color: '#D97706' }
                  ]}>{authPercent}%</Text>
                </View>
              </View>
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                {isAuthCritical ? (
                  <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '500' }}>
                    ⚠️ CRITICAL: Only {Math.round(50000 - estimatedAuth)} Firebase Auth sign-ins remaining today
                  </Text>
                ) : isAuthWarning ? (
                  <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '500' }}>
                    ⚠️ WARNING: {Math.round(50000 - estimatedAuth)} Firebase Auth sign-ins remaining today
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '500' }}>
                    ✅ {Math.round(50000 - estimatedAuth)} Firebase Auth sign-ins remaining today
                  </Text>
                )}
              </View>
            </View>

            {/* Cleanup Stats */}
            <View style={{ backgroundColor: '#FEF3C7', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FCD34D', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Trash2 size={20} color="#D97706" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#92400E', marginLeft: 8 }}>Old Screenshots (30+ days)</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#D97706' }}>{cleanupStats.totalOldScreenshots}</Text>
              <Text style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                Can free ~{cleanupStats.storageToFreeMB} MB of storage
              </Text>
            </View>

            {/* Cleanup Button */}
            <TouchableOpacity
              style={[styles.addPaperBtn, { backgroundColor: '#DC2626', marginBottom: 12 }]}
              onPress={handleCleanup}
              disabled={isCleaning}
            >
              {isCleaning ? (
                <Text style={styles.addPaperBtnText}>Cleaning...</Text>
              ) : (
                <>
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={styles.addPaperBtnText}>Run 30-Day Cleanup</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
              This will permanently delete screenshots older than 30 days
            </Text>
          </View>
        )}


      </ScrollView>

      <Modal
        visible={isCustomerPaymentsOpen && !!selectedCustomer}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCustomerPaymentsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedCustomer?.name || 'Customer'}</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 }}>
                  +91 {selectedCustomer?.phone || ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCustomerPaymentsOpen(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.paySummaryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paySummaryTitle}>{monthTitle(paymentsMonth)}</Text>
                <Text style={styles.paySummaryLine}>
                  Due ₹{Math.round(selectedMonthDue).toLocaleString('en-IN')}  •  Paid ₹{Math.round(selectedMonthPaid).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.paySummaryBalance}>
                  Balance ₹{Math.round(selectedMonthBalance).toLocaleString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addPayBtnBig}
                onPress={() => (selectedCustomer ? openPaymentEditor(selectedCustomer, selectedMonthBalance > 0 ? selectedMonthBalance : undefined) : null)}
                activeOpacity={0.85}
              >
                <Text style={styles.addPayBtnBigText}>Add Payment</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Subscriptions</Text>
              {selectedSubs.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Text style={styles.emptyStateTitle}>No subscriptions</Text>
                  <Text style={styles.emptyStateSub}>This customer has not subscribed to any paper yet.</Text>
                </View>
              ) : (
                selectedSubs.map((s) => (
                  <View key={s.id} style={styles.subRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subRowTitle}>{s.paperName}</Text>
                      <Text style={styles.subRowMeta} numberOfLines={1}>
                        {s.plan || 'Monthly'}  •  ₹{Math.round((typeof s.priceMonth === 'number' && isFinite(s.priceMonth) ? s.priceMonth : 0)).toLocaleString('en-IN')}/mo
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Payment History</Text>
              {selectedPayments.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Text style={styles.emptyStateTitle}>No payments yet</Text>
                  <Text style={styles.emptyStateSub}>Payments you add will appear here with full history.</Text>
                </View>
              ) : (
                selectedPayments.map((p) => (
                  <View key={p.id} style={styles.payHistoryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payHistoryTitle}>
                        ₹{Math.round(p.amount).toLocaleString('en-IN')}  •  {p.forMonth}
                      </Text>
                      <Text style={styles.payHistoryMeta} numberOfLines={1}>
                        {p.method || 'UPI'}{p.txnId ? `  •  ${p.txnId}` : ''}
                      </Text>
                      {(p as any).screenshotUrl ? (
                        <View style={{ marginTop: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB', marginBottom: 4 }}>📎 Payment Screenshot</Text>
                          <Image
                            source={{ uri: (p as any).screenshotUrl }}
                            style={{ width: '100%', height: 160, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                            resizeMode="contain"
                          />
                          {p.status === 'Pending' && (
                            <TouchableOpacity
                              onPress={() => store.updatePayment(p.id, { status: 'Paid' })}
                              style={{ marginTop: 8, backgroundColor: '#16A34A', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                              activeOpacity={0.85}
                            >
                              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>✓ Mark as Paid</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[styles.payStatusPill, p.status === 'Paid' ? styles.payStatusPaid : styles.payStatusPending]}
                      onPress={() => store.updatePayment(p.id, { status: p.status === 'Paid' ? 'Pending' : 'Paid' })}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.payStatusText, p.status === 'Paid' ? styles.payStatusTextPaid : styles.payStatusTextPending]}>
                        {p.status}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isPaymentEditorOpen} transparent animationType="slide" onRequestClose={() => setIsPaymentEditorOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Payment</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 }}>
                  {selectedCustomer ? `${selectedCustomer.name} • +91 ${selectedCustomer.phone}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsPaymentEditorOpen(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 300"
              keyboardType="numeric"
              value={paymentDraft.amount}
              onChangeText={(t) => setPaymentDraft({ ...paymentDraft, amount: t })}
            />

            <Text style={styles.inputLabel}>Month (YYYY-MM)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={paymentsMonth}
              value={paymentDraft.forMonth || paymentsMonth}
              onChangeText={(t) => setPaymentDraft({ ...paymentDraft, forMonth: t })}
            />

            <Text style={styles.inputLabel}>Method</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="UPI / Cash / Card"
              value={paymentDraft.method}
              onChangeText={(t) => setPaymentDraft({ ...paymentDraft, method: t })}
            />

            <Text style={styles.inputLabel}>Transaction / Ref ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Optional"
              value={paymentDraft.txnId}
              onChangeText={(t) => setPaymentDraft({ ...paymentDraft, txnId: t })}
            />

            <View style={styles.payStatusToggleRow}>
              <TouchableOpacity
                style={[styles.payToggleBtn, paymentDraft.status === 'Paid' && styles.payToggleBtnActivePaid]}
                onPress={() => setPaymentDraft({ ...paymentDraft, status: 'Paid' })}
                activeOpacity={0.85}
              >
                <Text style={[styles.payToggleText, paymentDraft.status === 'Paid' && styles.payToggleTextActive]}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.payToggleBtn, paymentDraft.status === 'Pending' && styles.payToggleBtnActivePending]}
                onPress={() => setPaymentDraft({ ...paymentDraft, status: 'Pending' })}
                activeOpacity={0.85}
              >
                <Text style={[styles.payToggleText, paymentDraft.status === 'Pending' && styles.payToggleTextActive]}>Pending</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={savePayment} activeOpacity={0.9}>
              <Text style={styles.saveBtnText}>Save Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Paper Modal */}
      <Modal visible={isAddingPaper} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Add New Publication</Text>
              <TouchableOpacity onPress={() => setIsAddingPaper(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categorySelector}>
              {(['Paper', 'Magazine'] as const).map((cat) => {
                const isActive = newPaper.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewPaper({ ...newPaper, category: cat })}
                    style={[
                      styles.categoryOption,
                      isActive && (cat === 'Paper' ? styles.catOptionActivePaper : styles.catOptionActiveMag),
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 14, marginRight: 6 }}>
                      {cat === 'Paper' ? '📰' : '📚'}
                    </Text>
                    <Text style={[
                      styles.categoryOptionText,
                      isActive && styles.categoryOptionTextActive,
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Publication Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Times of India"
              value={newPaper.name}
              onChangeText={text => setNewPaper({ ...newPaper, name: text })}
            />

            <Text style={styles.inputLabel}>Language</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. English"
              value={newPaper.language}
              onChangeText={text => setNewPaper({ ...newPaper, language: text })}
            />
            <View style={styles.languageChipsWrap}>
              {(newPaper.category === 'Magazine'
                ? ['Kannada', 'English', 'Tamil', 'Malayalam']
                : ['Kannada', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Hindi']
              ).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.langQuickChip}
                  onPress={() => setNewPaper({ ...newPaper, language: lang })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langQuickChipText}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Daily Price (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 5"
                  keyboardType="numeric"
                  value={newPaper.priceDay}
                  onChangeText={text => setNewPaper({ ...newPaper, priceDay: text })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Monthly Price (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 150"
                  keyboardType="numeric"
                  value={newPaper.priceMonth}
                  onChangeText={text => setNewPaper({ ...newPaper, priceMonth: text })}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.inputLabel}>Publication Image</Text>
              <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 12, marginLeft: 4 }}>REQUIRED</Text>
            </View>
            {newPaper.imageUrl ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Image source={{ uri: newPaper.imageUrl }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                <TouchableOpacity onPress={() => setNewPaper({ ...newPaper, imageUrl: '' })} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginBottom: 8 }}>
                <TouchableOpacity
                  style={[styles.imagePickerBtn, { borderColor: '#EF4444', borderWidth: 2, borderStyle: 'dashed', backgroundColor: '#FEF2F2' }]}
                  onPress={pickImage}
                >
                  <ImageIcon size={20} color="#EF4444" />
                  <Text style={[styles.imagePickerText, { color: '#EF4444', fontWeight: '700' }]}>Select from Gallery</Text>
                </TouchableOpacity>
                <Text style={{ marginTop: 6, color: '#B91C1C', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                  ⚠️ You must choose a logo before you can save this publication
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, isUploading && { opacity: 0.6 }]}
              onPress={handleAddPaper}
              disabled={isUploading}
            >
              {isUploading ? (
                <Text style={styles.saveBtnText}>Uploading... ⏳</Text>
              ) : (
                <Text style={styles.saveBtnText}>Save {newPaper.category}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Edit Paper Modal ── */}
      <Modal visible={isEditingPaper} transparent animationType="slide" onRequestClose={() => setIsEditingPaper(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={styles.modalTitle}>Edit Publication</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 }}>
                  Update details or remove this publication
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setIsEditingPaper(false); setEditingPaper(null); }}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {editingPaper && (
              <>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categorySelector}>
                  {(['Paper', 'Magazine'] as const).map((cat) => {
                    const isActive = editingPaper.category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setEditingPaper({ ...editingPaper, category: cat })}
                        style={[
                          styles.categoryOption,
                          isActive && (cat === 'Paper' ? styles.catOptionActivePaper : styles.catOptionActiveMag),
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 14, marginRight: 6 }}>
                          {cat === 'Paper' ? '📰' : '📚'}
                        </Text>
                        <Text style={[
                          styles.categoryOptionText,
                          isActive && styles.categoryOptionTextActive,
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Publication Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Times of India"
                  value={editingPaper.name}
                  onChangeText={text => setEditingPaper({ ...editingPaper, name: text })}
                />

                <Text style={styles.inputLabel}>Language</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. English"
                  value={editingPaper.language}
                  onChangeText={text => setEditingPaper({ ...editingPaper, language: text })}
                />
                <View style={styles.languageChipsWrap}>
                  {(editingPaper.category === 'Magazine'
                    ? ['Kannada', 'English', 'Tamil', 'Malayalam']
                    : ['Kannada', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Hindi']
                  ).map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={styles.langQuickChip}
                      onPress={() => setEditingPaper({ ...editingPaper, language: lang })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.langQuickChipText}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Daily Price (₹)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 5"
                      keyboardType="numeric"
                      value={editingPaper.priceDay}
                      onChangeText={text => setEditingPaper({ ...editingPaper, priceDay: text })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Monthly Price (₹)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 150"
                      keyboardType="numeric"
                      value={editingPaper.priceMonth}
                      onChangeText={text => setEditingPaper({ ...editingPaper, priceMonth: text })}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Rating (1.0 – 5.0)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 4.5"
                  keyboardType="numeric"
                  value={editingPaper.rating}
                  onChangeText={text => setEditingPaper({ ...editingPaper, rating: text })}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.inputLabel}>Publication Image</Text>
                  {!editingPaper.currentImageSrc && !editingPaper.imageUrl && (
                    <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 12, marginLeft: 4 }}>REQUIRED</Text>
                  )}
                </View>
                {editingPaper.imageUrl ? (
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Image source={{ uri: editingPaper.imageUrl }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                    <TouchableOpacity onPress={() => setEditingPaper({ ...editingPaper, imageUrl: '' })} style={{ marginTop: 8 }}>
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Remove New Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : editingPaper.currentImageSrc ? (
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Image
                      source={resolvePaperImage(editingPaper.currentImageSrc) || undefined}
                      defaultSource={IMAGES['vijayavani.webp'] as any}
                      style={{ width: 80, height: 80, borderRadius: 12 }}
                      resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={pickEditImage}>
                      <ImageIcon size={18} color="#2563EB" />
                      <Text style={[styles.imagePickerText, { color: '#2563EB', fontWeight: '700' }]}>Replace Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ marginBottom: 8 }}>
                    <TouchableOpacity
                      style={[styles.imagePickerBtn, { borderColor: '#EF4444', borderWidth: 2, borderStyle: 'dashed', backgroundColor: '#FEF2F2' }]}
                      onPress={pickEditImage}
                    >
                      <ImageIcon size={20} color="#EF4444" />
                      <Text style={[styles.imagePickerText, { color: '#EF4444', fontWeight: '700' }]}>Select from Gallery</Text>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 6, color: '#B91C1C', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                      ⚠️ This publication has no logo yet — please select one before saving
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, isEditingUploading && { opacity: 0.6 }]}
                    onPress={handleDeletePaper}
                    disabled={isEditingUploading}
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { flex: 1, marginTop: 8 }, isEditingUploading && { opacity: 0.6 }]}
                    onPress={handleSaveEditPaper}
                    disabled={isEditingUploading}
                  >
                    {isEditingUploading ? (
                      <Text style={styles.saveBtnText}>Saving... ⏳</Text>
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Customer Billing Modal */}
      <AdminCustomerBillingModal
        visible={!!selectedCustomerForBilling}
        customer={selectedCustomerForBilling}
        onClose={() => setSelectedCustomerForBilling(null)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#2563EB', fontWeight: '800' },

  container: { padding: 16 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  customerStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customerStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  customerStatValue: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  customerStatLabel: { marginTop: 1, fontSize: 9, fontWeight: '700', color: '#94A3B8' },

  /* filter chips */
  custFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  custFilterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  custFilterDot: { width: 5, height: 5, borderRadius: 3 },
  custFilterText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  custFilterCount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  mutedPill: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  customerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  customerBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  emptyText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  /* ── Customer Premium Card ── */
  custCardPremium: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  custAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  custAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  approveBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  rejectBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  custName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  custAlias: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 1 },
  custEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 6,
  },
  custEmptyTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 4 },
  custEmptySub: { fontSize: 11, fontWeight: '500', color: '#94A3B8', textAlign: 'center' },

  actionPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  actionName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  actionDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#0F172A' },
  addCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  addCustomerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  custCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paperLogoBox: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 0,
    overflow: 'hidden',
  },
  custAddress: { fontSize: 12, color: '#64748B', flex: 1 },
  custMeta: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },

  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDelivered: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
  badgeTextDelivered: { color: '#065F46' },

  custActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnSkip: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  btnDeliver: { backgroundColor: '#10B981' },
  btnTextSkip: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  btnTextDeliver: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  paperCatalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  paperImageBox: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 0,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  categoryDot: {
    width: 6,
    height: 24,
    borderRadius: 3,
    marginRight: 10,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 16,
  },
  languageName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  languageBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  languageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  catOptionActivePaper: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  catOptionActiveMag: {
    backgroundColor: '#FAF5FF',
    borderColor: '#9333EA',
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryOptionTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  languageChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
    marginTop: -4,
  },
  langQuickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  langQuickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  editBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },

  subDetailsContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  detailVal: {
    fontWeight: '800',
    color: '#0F172A',
  },
  addPaperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPaperBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  emptyStateBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyStateSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  paymentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentsSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  monthNav: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  monthNavBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  monthNavText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  paymentCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  paymentCustomerName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  paymentCustomerMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  addPayBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addPayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  payStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  payStatusPaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  payStatusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  payStatusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  payStatusTextPaid: {
    color: '#15803D',
  },
  payStatusTextPending: {
    color: '#B45309',
  },
  paySummaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paySummaryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  paySummaryLine: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  paySummaryBalance: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  addPayBtnBig: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addPayBtnBigText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  subRowTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  subRowMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  subStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  subStatusDelivered: {
    backgroundColor: '#D1FAE5',
  },
  subStatusPending: {
    backgroundColor: '#DBEAFE',
  },
  subStatusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  subStatusTextDelivered: {
    color: '#065F46',
  },
  subStatusTextPending: {
    color: '#1D4ED8',
  },
  payHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  payHistoryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  payHistoryMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  payStatusToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    marginTop: -4,
  },
  payToggleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payToggleBtnActivePaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  payToggleBtnActivePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  payToggleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#475569',
  },
  payToggleTextActive: {
    color: '#0F172A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalHint: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  imagePickerBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
