import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { uploadImage } from '../../../database/storageHelper';
import * as Location from 'expo-location';
import {
  User,
  MapPin,
  Phone,
  LogOut,
  CheckCircle2,
  Calendar,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Shield,
  Edit3,
  Check,
  Clock,
  Sparkles,
  Newspaper,
  Award,
  X,
  Save,
  LocateFixed,
  ArrowLeft,
  Eye,
  EyeOff,
  Store,
  FileText,
  UploadCloud,
  CheckCircle,
} from 'lucide-react-native';
import { store } from '../../../utils/store';
import { fetchVendorByCode, updateVendor } from '../../../database';
import { updateCustomerBill } from '../../../database/users';

export default function ProfileScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [appSettings, setAppSettings] = useState(store.getAppSettings());

  // Editable fields in modal
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Vendor Login states
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorCode, setVendorCode] = useState('');
  const [showVendorCode, setShowVendorCode] = useState(false);
  const [isVerifyingVendor, setIsVerifyingVendor] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
      setAppSettings(store.getAppSettings());
    });
    return unsubscribe;
  }, []);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPaymentAmountModalOpen, setIsPaymentAmountModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [billForPayment, setBillForPayment] = useState<any>(null);

  const handleUploadScreenshot = async (bill: any) => {
    setBillForPayment(bill);
    setPaymentAmount(bill.totalAmount?.toString() || '');
    setIsPaymentAmountModalOpen(true);
  };

  const handleProcessPaymentUpload = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    if (!user?.phone) {
      Alert.alert('Error', 'User not logged in. Please login again.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please grant permission to access your gallery to upload a screenshot.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0].uri) return;

      setIsUploading(true);
      const uri = result.assets[0].uri;

      const publicUrl = await uploadImage(uri, `payment_screenshots/${user.phone}_${Date.now()}.jpg`);

      await updateCustomerBill(user.phone, [
        ...((user as any)?.bills?.map((b: any) =>
          b.id === billForPayment.id ? { ...b, paymentProof: publicUrl, paidAmount: Number(paymentAmount) } : b
        ) || []),
      ]);

      setIsPaymentAmountModalOpen(false);
      setPaymentAmount('');
      setBillForPayment(null);
      Alert.alert('Success', 'Payment screenshot uploaded successfully. Admin will review it.');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9972505709@ibl%26pn=Newspaper%20Delivery%26cu=INR';

  const handleDownloadQR = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant media library permissions to save the QR code.');
        return;
      }

      const fileUri = FileSystem.documentDirectory + 'qr_code.png';
      const { uri } = await FileSystem.downloadAsync(qrUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert('Success', 'QR Code saved to gallery!');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save QR Code: ' + e.message);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditAddress(user?.address || '');
    setIsEditModalOpen(true);
  };

  const handleFetchGps = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo.length > 0 && geo[0]) {
        const a = geo[0];
        const parts = [];
        if (a?.name && !a.name.includes('+') && isNaN(Number(a.name))) parts.push(a.name);
        if (a?.street && a.street !== a.name) parts.push(a.street);
        if (a?.district) parts.push(a.district); else if (a?.subregion) parts.push(a.subregion);
        if (a?.city) parts.push(a.city);
        if (a?.postalCode) parts.push(a.postalCode);

        const fullAddr = parts.filter(Boolean).join(', ');
        if (fullAddr) setEditAddress(fullAddr);
      }
    } catch {
      Alert.alert('GPS Error', 'Could not detect location automatically.');
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSaveModal = () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!editAddress.trim()) {
      Alert.alert('Required', 'Please enter your delivery address.');
      return;
    }

    store.setUser({
      name: editName.trim(),
      phone: user?.phone || '9876543210',
      address: editAddress.trim(),
      isAdmin: user?.isAdmin || false,
    });

    setIsEditModalOpen(false);
    Alert.alert('Updated', 'Profile details updated successfully!');
  };

  const handleVendorLogin = async () => {
    if (vendorCode.trim().length === 0) return;
    setIsVerifyingVendor(true);
    try {
      const vendor = await fetchVendorByCode(vendorCode.trim());
      if (vendor) {
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await updateVendor(vendor.id, { currentSessionToken: sessionToken });

        store.setUser({
          name: vendor.name,
          phone: vendor.phone || '',
          address: vendor.address || '',
          isAdmin: false,
          isVendor: true,
          vendorData: { ...vendor, currentSessionToken: sessionToken },
          sessionToken: sessionToken,
        });
        Alert.alert('Success', 'Vendor Login successful!');
        setIsVendorModalOpen(false);
        router.push('/vendor/dashboard' as any);
      } else {
        Alert.alert('Error', 'Invalid secret code');
      }
    } catch (e) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setIsVerifyingVendor(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          store.setUser(null);
          // Force navigation after a small delay to ensure state updates
          setTimeout(() => {
            if (router.canGoBack()) {
              router.replace('/customer/login');
            }
          }, 100);
        },
      },
    ]);
  };

  const handleSupport = () => {
    Linking.openURL('tel:9972505709');
  };

  const getInitials = (str?: string) => {
    if (!str) return 'PF';
    const parts = str.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  // Early return for guest view
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
        <View style={styles.blueTopHeader}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginTop: 10 }}>Profile</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <User size={48} color="#94A3B8" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' }}>
            Welcome, Guest!
          </Text>
          <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
            Log in to manage your newspaper subscriptions, track your daily deliveries, and view your monthly bill.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563EB', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 }}
            onPress={() => router.push('/customer/login')}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Log In / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // User-dependent calculations - only run if user exists
  const userDeliveries = (deliveries || []).filter((d) => d?.name === user?.name);
  const activeCount = userDeliveries.length;
  const totalMonthlyCost = userDeliveries.reduce((acc, d) => acc + (d?.priceMonth || 180), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* ── RICH BLUE TOP HEADER ── */}
      <View style={styles.blueTopHeader}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerGreeting}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your personal preferences</Text>
          </View>

          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={openEditModal}
            activeOpacity={0.8}
          >
            <View style={styles.editHeaderPill}>
              <Edit3 size={14} color="#FFFFFF" />
              <Text style={styles.editHeaderText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* User Hero Row */}
        <View style={styles.heroRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userNameText}>{user?.name || 'Customer'}</Text>
            </View>
            <Text style={styles.userPhoneText}>+91 {user?.phone || '9876543210'}</Text>
            <Text style={styles.userRoleText}>
              {user?.isAdmin ? 'Administrator' : 'Daily Doorstep Subscriber'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── LIGHT BODY CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollBody}
      >
        {/* ── QUICK STATS ROW ── */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Newspaper size={16} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Papers</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <CheckCircle2 size={16} color="#16A34A" />
            </View>
            <Text style={styles.statNumber}>₹{totalMonthlyCost}</Text>
            <Text style={styles.statLabel}>Monthly Cost</Text>
          </View>
        </View>

        {/* ── MY BILLS ── */}
        {user?.customerKind === 'legacy' && user?.approvalStatus === 'approved' && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>My Unpaid Bills</Text>
              </View>
              {(() => {
                const unpaidBills = ((user as any).bills || []).filter((b: any) => b.status !== 'Paid');
                if (unpaidBills.length === 0) {
                  return (
                    <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
                      No unpaid bills. You're all caught up! 🎉
                    </Text>
                  );
                }
                return unpaidBills.map((bill: any) => (
                  <View key={bill.id} style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{bill.month}</Text>
                        <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600', marginTop: 2 }}>Unpaid</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#2563EB' }}>₹{bill.totalAmount}</Text>
                        <TouchableOpacity onPress={() => setSelectedBill(bill)} style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '600' }}>View Bill</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {bill.paymentProof ? (
                      <View style={{ backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={14} color="#B45309" />
                        <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '600', marginLeft: 6 }}>Verification Pending by Admin</Text>
                      </View>
                    ) : (
                      <View style={{ marginTop: 4, gap: 8 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                          onPress={() => Linking.openURL(`upi://pay?pa=9972505709@ibl&pn=Newspaper%20Delivery&am=${bill.totalAmount}&cu=INR`)}
                        >
                          <CreditCard size={14} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Pay via UPI ₹{bill.totalAmount}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleUploadScreenshot(bill)}
                          disabled={isUploading}
                          style={{ backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                        >
                          <UploadCloud size={14} color="#64748B" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>{isUploading ? 'Uploading...' : 'Upload Screenshot'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ));
              })()}
            </View>

            {/* ── PAYMENT HISTORY ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Payment History</Text>
              </View>
              {(() => {
                const paidBills = ((user as any).bills || []).filter((b: any) => b.status === 'Paid').map((b: any) => ({
                  id: b.id, amount: b.totalAmount, date: b.paidAt || b.date, status: 'Paid', title: `Bill: ${b.month}`
                }));
                const combined = [...paidBills].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
                if (combined.length === 0) {
                  return <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>No payments recorded yet.</Text>;
                }
                return combined.map((p: any, i: number) => (
                  <View key={p.id} style={[{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }, i > 0 && { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <CheckCircle size={20} color="#10B981" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>{p.title}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 }}>₹{p.amount}</Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46' }}>Paid</Text>
                    </View>
                  </View>
                ));
              })()}
            </View>
          </>
        )}

        {/* ── CURRENT DETAILS CARD ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Delivery & Personal Info</Text>
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.7}>
              <Text style={styles.editLinkText}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.infoDisplayRow}>
              <User size={16} color="#2563EB" />
              <Text style={styles.infoDisplayText}>{user?.name || 'Customer'}</Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Doorstep Delivery Address</Text>
            <View style={[styles.infoDisplayRow, { alignItems: 'flex-start' }]}>
              <MapPin size={16} color="#2563EB" style={{ marginTop: 2 }} />
              <Text style={[styles.infoDisplayText, { flex: 1 }]}>
                {user?.address || 'No address set'}
              </Text>
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Registered Mobile Number</Text>
            <View style={styles.infoDisplayRow}>
              <Phone size={16} color="#64748B" />
              <Text style={[styles.infoDisplayText, { color: '#64748B' }]}>
                +91 {user?.phone || '9876543210'}
              </Text>
              <View style={styles.verifiedLock}>
                <Text style={styles.verifiedLockText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── VENDOR LOGIN SECTION ── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => setIsVendorModalOpen(true)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Store size={18} color="#9333EA" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Are You a Vendor?</Text>
              <Text style={styles.menuSub}>Login to vendor dashboard</Text>
            </View>
            <ChevronRight size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* ── PREFERENCES ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Subscription Controls</Text>

          {/* Manage Subscriptions */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/customer/bottom_nav/papers')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Calendar size={18} color="#16A34A" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Pause / Skip Deliveries</Text>
              <Text style={styles.menuSub}>Manage dates & vacation pauses</Text>
            </View>
            <ChevronRight size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Payment Details */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/customer/bottom_nav/papers')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#FDF4FF' }]}>
              <CreditCard size={18} color="#9333EA" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Billing & History</Text>
              <Text style={styles.menuSub}>Monthly invoices and receipts</Text>
            </View>
            <ChevronRight size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* ── HELP & SUPPORT ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Support & Policies</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleSupport}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFF7ED' }]}>
              <HelpCircle size={18} color="#EA580C" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSub}>Contact Customer care (Agent/Owner)</Text>
            </View>
            <ChevronRight size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => setIsTermsModalOpen(true)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#F1F5F9' }]}>
              <Shield size={18} color="#475569" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Terms & Privacy</Text>
              <Text style={styles.menuSub}>PaperFresh service agreements</Text>
            </View>
            <ChevronRight size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT BUTTON ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out from Account</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={styles.versionFooter}>PaperFresh Customer App • v1.0.4</Text>
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '800', marginTop: 4 }}>
            Developed by MSV Global Tech
          </Text>
        </View>
      </ScrollView>

      {/* ── SLIDE-UP EDIT MODAL SHEET ── */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="#2563EB" />
                <Text style={styles.modalTitle}>Edit Profile Details</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsEditModalOpen(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Input: Full Name */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <View style={styles.modalInputRow}>
                <User size={16} color="#2563EB" />
                <TextInput
                  style={styles.modalTextInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Input: Delivery Address */}
            <View style={styles.modalFieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.modalLabel}>Delivery Address</Text>
                <TouchableOpacity
                  style={styles.gpsAutoBtn}
                  onPress={handleFetchGps}
                  activeOpacity={0.7}
                >
                  <LocateFixed size={12} color="#2563EB" />
                  <Text style={styles.gpsAutoText}>
                    {loadingGps ? 'Locating...' : 'Auto-GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.modalInputRow, { height: 74, alignItems: 'flex-start', paddingTop: 10 }]}>
                <MapPin size={16} color="#2563EB" style={{ marginTop: 2 }} />
                <TextInput
                  style={[styles.modalTextInput, { height: '100%', textAlignVertical: 'top' }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="House #, Street, Area, City"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={handleSaveModal}
                activeOpacity={0.85}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── SLIDE-UP TERMS MODAL SHEET ── */}
      <Modal
        visible={isTermsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTermsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="#2563EB" />
                <Text style={styles.modalTitle}>Terms & Conditions</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsTermsModalOpen(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>1. Acceptance of Terms</Text>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 }}>By accessing and using the PaperFresh application, you agree to comply with and be bound by these terms and conditions.</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>2. Subscription & Billing</Text>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 }}>A one-time booking fee of ₹50 is required to initiate a subscription. Your monthly newspaper/magazine bills are generated at the end of each month and collected directly by your delivery vendor. Failure to pay may result in suspension of deliveries.</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>3. Deliveries</Text>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 }}>Deliveries are typically completed between 5:30 AM and 7:00 AM daily. We are not responsible for delays caused by extreme weather, strikes, or supply chain issues.</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>4. Vacation Pauses & Skips</Text>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 }}>You can pause or skip deliveries using the app. You will not be billed for days that are successfully skipped prior to the delivery cutoff time (usually 9:00 PM the previous day).</Text>

              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>5. Privacy Policy</Text>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 }}>We collect your name, phone number, and address strictly for the purpose of managing your deliveries. Your data is not shared with third parties for marketing purposes.</Text>
            </ScrollView>
            <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.modalDoneBtn, { width: '100%' }]}
                onPress={() => setIsTermsModalOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDoneText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── VENDOR LOGIN MODAL ── */}
      <Modal
        visible={isVendorModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVendorModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Store size={18} color="#9333EA" />
                <Text style={styles.modalTitle}>Vendor Login</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsVendorModalOpen(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalLabel}>Secret Vendor Code</Text>
              <View style={styles.modalInputRow}>
                <TextInput
                  style={[styles.modalTextInput, { letterSpacing: 1 }]}
                  placeholder="Enter your secret code"
                  placeholderTextColor="#94A3B8"
                  value={vendorCode}
                  onChangeText={setVendorCode}
                  secureTextEntry={!showVendorCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity onPress={() => setShowVendorCode(!showVendorCode)} style={{ padding: 4 }}>
                  {showVendorCode ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsVendorModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalDoneBtn, { backgroundColor: '#9333EA', shadowColor: '#9333EA' }]}
                onPress={handleVendorLogin}
                activeOpacity={0.85}
                disabled={isVerifyingVendor}
              >
                <Text style={styles.modalDoneText}>{isVerifyingVendor ? 'Verifying...' : 'Next'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── PAYMENT AMOUNT MODAL ── */}
      <Modal visible={isPaymentAmountModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="#2563EB" />
                <Text style={styles.modalTitle}>Enter Payment Amount</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setIsPaymentAmountModalOpen(false);
                  setPaymentAmount('');
                  setBillForPayment(null);
                }}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalLabel}>Amount Paid (₹)</Text>
              <View style={styles.modalInputRow}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#64748B', marginRight: 8 }}>₹</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              {billForPayment && (
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                  Bill Amount: ₹{billForPayment.totalAmount}
                </Text>
              )}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsPaymentAmountModalOpen(false);
                  setPaymentAmount('');
                  setBillForPayment(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={handleProcessPaymentUpload}
                activeOpacity={0.85}
                disabled={isUploading}
              >
                <Text style={styles.modalDoneText}>{isUploading ? 'Uploading...' : 'Upload Screenshot'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── VIEW BILL MODAL ── */}
      <Modal visible={!!selectedBill} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', maxHeight: '80%' }}>
            {selectedBill && (
              <>
                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#111827', letterSpacing: 1, marginBottom: 4 }}>NEWSPAPER DELIVERY</Text>
                  <View style={{ height: 1, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', marginVertical: 12 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: '#374151' }}>BILL: {selectedBill?.id?.slice(-6).toUpperCase() || 'N/A'}</Text>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: '#374151' }}>{new Date(selectedBill?.date || Date.now()).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: '#374151', marginBottom: 4 }}>CUSTOMER: {user?.name?.toUpperCase() || 'CUSTOMER'}</Text>
                  <View style={{ height: 1, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', marginVertical: 12 }} />
                  {(selectedBill.items || []).map((item: any, index: number) => (
                    <View key={item?.id || index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#111827', flex: 2 }}>{item?.name?.toUpperCase() || 'Item'}</Text>
                      <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#111827', textAlign: 'right' }}>₹{Number(item?.amount || 0).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={{ height: 1, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', marginVertical: 12 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: '800', color: '#111827' }}>TOTAL</Text>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16, fontWeight: '800', color: '#111827' }}>₹{Number(selectedBill?.totalAmount || 0).toFixed(2)}</Text>
                  </View>
                </ScrollView>
                <View style={{ padding: 16 }}>
                  <TouchableOpacity style={{ backgroundColor: '#F1F5F9', padding: 14, borderRadius: 10, alignItems: 'center' }} onPress={() => setSelectedBill(null)}>
                    <Text style={{ color: '#475569', fontWeight: '700' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2563EB',
  },

  /* Blue Top Header */
  blueTopHeader: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerGreeting: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  editHeaderBtn: {
    padding: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* User Hero Row */
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563EB',
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },
  userPhoneText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  userRoleText: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '700',
    marginTop: 2,
  },

  /* Body Content */
  scrollBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Stats Bar */
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  editLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  /* Display Fields */
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  infoDisplayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  verifiedLock: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  verifiedLockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Menu Items */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },

  /* Logout Button */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Slide-up Modal Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFieldGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gpsAutoText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalDoneBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDoneText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── UPI/QR card in Profile ── */
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 12,
  },
  upiTitle: { fontSize: 14, fontWeight: '800', color: '#1E3A8A' },
  upiSub: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2, marginBottom: 8 },
  upiId: { fontSize: 13, fontWeight: '700', color: '#1D4ED8', letterSpacing: 0.3 },
  upiName: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  upiPayBtn: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  upiPayBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  upiMissing: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 6 },
  upiQrBox: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  upiQrImage: { width: 88, height: 88 },
  pendingApprovalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 12,
  },
  pendingApprovalIcon: { fontSize: 24 },
  pendingApprovalTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  pendingApprovalSub: { fontSize: 11, fontWeight: '500', color: '#B45309', marginTop: 3, lineHeight: 16 },

  /* ── Pay Now compact row ── */
  payNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  payNowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payNowIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  payNowTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  payNowSub: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  payNowBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  /* ── Full-screen Payment Modal ── */
  payModalSafe: { flex: 1, backgroundColor: '#F0F4FF' },
  payModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  payModalBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payModalTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  payModalSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  payModalBody: { padding: 20, paddingBottom: 48, alignItems: 'center' },

  payMerchantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  payMerchantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  payMerchantAvatarText: { fontSize: 18, fontWeight: '900', color: '#2563EB' },
  payMerchantName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  payMerchantLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },

  payQrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  payQrLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  payQrFrame: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  payQrImage: { width: 216, height: 216, borderRadius: 8 },
  payQrPlaceholder: { alignItems: 'center' },
  payQrPlaceholderText: { fontSize: 48 },
  payQrHint: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },

  payDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  payDividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  payDividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  payUpiBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  payUpiIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  payUpiIdRow: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 6,
  },
  payUpiIdText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  payUpiNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
  },
  payOpenUpiBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payOpenUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  payFooterNote: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});