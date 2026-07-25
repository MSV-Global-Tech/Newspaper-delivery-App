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
} from 'react-native';
import {
  Users,
  TrendingUp,
  FileText,
  DollarSign,
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
  Image as ImageIcon,
  Phone,
  Trash2,
  UserPlus,
  BookOpen,
  Shield,
  Truck,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { IMAGES, resolvePaperImage } from '../../assets/images';
import { store } from '../../utils/store';
import { uploadNewspaperLogo } from '../../database';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'papers' | 'agents' | 'access'>('overview');
  const [search, setSearch] = useState('');
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [papersList, setPapersList] = useState(store.getPapers());
  const [adminNumbers, setAdminNumbers] = useState(store.getAdminNumbers());
  const [agentsList, setAgentsList] = useState(store.getAgents());
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

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

  // Add Agent State
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', area: '', location: '' });

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setDeliveries(store.getDeliveries());
      setPapersList(store.getPapers());
      setAdminNumbers(store.getAdminNumbers());
      setAgentsList(store.getAgents());
    });
    return unsubscribe;
  }, []);

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.phone || !newAgent.area) return;
    store.addAgent({
      name: newAgent.name.trim(),
      phone: newAgent.phone.trim(),
      area: newAgent.area.trim(),
      location: newAgent.location.trim(),
      isActive: true,
    });
    setNewAgent({ name: '', phone: '', area: '', location: '' });
    setIsAddingAgent(false);
  };

  const handleDeleteAgent = (id: string) => {
    store.deleteAgent(id);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPaper({ ...newPaper, imageUrl: result.assets[0].uri });
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
    } catch (e) {
      console.warn('[Admin] Upload failed:', e);
    } finally {
      setIsUploading(false);
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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && editingPaper) {
      setEditingPaper({ ...editingPaper, imageUrl: result.assets[0].uri });
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
      if (editingPaper.imageUrl) {
        imageSrc = await uploadNewspaperLogo(editingPaper.imageUrl, editingPaper.name);
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
    } catch (e) {
      console.warn('[Admin] Edit paper save failed:', e);
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
            store.deletePaper(editingPaper.id);
            setIsEditingPaper(false);
            setEditingPaper(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateStatus = (id: string, newStatus: 'Delivered' | 'Skipped') => {
    store.updateDeliveryStatus(id, newStatus);
  };

  const handleLogout = () => {
    store.setUser(null);
    router.replace('/customer/login');
  };

  const totalCustomers = new Set(deliveries.map(d => d.name)).size;
  const activeSubs = deliveries.length;
  const totalMonthlyRevenue = deliveries.reduce((sum, d) => sum + (d.priceMonth || 180), 0);
  const pendingCount = deliveries.filter(d => d.status === 'Pending').length;

  const dynamicStats = [
    { label: 'Total Customers', value: totalCustomers.toString(), change: '+12%', isUp: true, icon: Users, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Active Subs', value: activeSubs.toString(), change: '+8%', isUp: true, icon: Check, bg: '#ECFDF5', color: '#059669' },
    { label: 'Monthly Revenue', value: `₹${totalMonthlyRevenue.toLocaleString('en-IN')}`, change: '+15%', isUp: true, icon: DollarSign, bg: '#FEF2F2', color: '#DC2626' },
    { label: 'Pending Delivery', value: pendingCount.toString(), change: '-4%', isUp: false, icon: FileText, bg: '#FFF7ED', color: '#D97706' },
  ];

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
            { key: 'overview',   label: 'Overview', icon: TrendingUp },
            { key: 'deliveries', label: 'Deliveries', icon: Truck },
            { key: 'papers',     label: 'Papers', icon: BookOpen },
            { key: 'agents',     label: 'Agents', icon: Users },
            { key: 'access',     label: 'Access', icon: Shield },
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      {stat.isUp ? (
                        <TrendingUp size={12} color="#10B981" />
                      ) : (
                        <TrendingDown size={12} color="#EF4444" />
                      )}
                      <Text style={{ fontSize: 11, fontWeight: '700', color: stat.isUp ? '#10B981' : '#EF4444' }}>
                        {stat.change}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Quick Actions Panel */}
            <Text style={styles.sectionTitle}>Admin Quick Tasks</Text>
            <View style={styles.actionPanel}>
              <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
                <View style={[styles.actionIndicator, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionName}>Export Delivery Sheets</Text>
                  <Text style={styles.actionDesc}>Generate PDF route logs for agents</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
                <View style={[styles.actionIndicator, { backgroundColor: '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionName}>Collect Outstanding Payments</Text>
                  <Text style={styles.actionDesc}>Send automated UPI payment reminders</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'deliveries' && (
          <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Search size={18} color="#94A3B8" />
              <TextInput
                placeholder="Search customers or routes..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Delivery List */}
            <Text style={styles.sectionTitle}>Today's Logs</Text>
            {deliveries
              .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
              .map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.custCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/customer/delivery/${item.id}`)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.paperLogoBox}>
                      <Image source={item.src} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.custName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={11} color="#64748B" />
                        <Text style={styles.custAddress} numberOfLines={1}>
                          {item.address}
                        </Text>
                      </View>
                      <Text style={styles.custMeta}>
                        {item.paperName}  •  {item.time}
                      </Text>
                      {(item.plan || item.startDate || item.paymentMethod) && (
                        <View style={{ marginTop: 8, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#F1F5F9' }}>
                          {item.plan && <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>Plan: <Text style={{ color: '#0F172A', fontWeight: '700' }}>{item.plan}</Text></Text>}
                          {item.startDate && <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500', marginTop: 3 }}>Start Date: <Text style={{ color: '#0F172A', fontWeight: '700' }}>{item.startDate}</Text></Text>}
                          {item.paymentMethod && <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500', marginTop: 3 }}>Order Fee (₹20): <Text style={{ color: '#0F172A', fontWeight: '700' }}>{item.paymentMethod}</Text></Text>}
                        </View>
                      )}
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.badge,
                        item.status === 'Delivered' && styles.badgeDelivered,
                        item.status === 'Skipped' && styles.badgeSkipped,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.status === 'Delivered' && styles.badgeTextDelivered,
                          item.status === 'Skipped' && styles.badgeTextSkipped,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Subscription/Order Details */}
                  {(item.plan || item.days) && (
                    <View style={styles.subDetailsContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Plan: <Text style={styles.detailVal}>{item.plan || 'Monthly'}</Text></Text>
                        <Text style={styles.detailLabel}>Cost: <Text style={styles.detailVal}>₹{item.priceMonth || 180}</Text></Text>
                      </View>
                      {item.days && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={styles.detailLabel}>Days: <Text style={styles.detailVal}>{item.days.map(d => d.slice(0, 3)).join(', ')}</Text></Text>
                          {item.startDate && (
                            <Text style={styles.detailLabel}>Start: <Text style={styles.detailVal}>{item.startDate}</Text></Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Actions Bar for Admin */}
                  {item.status === 'Pending' && (
                    <View style={styles.custActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnSkip]}
                        onPress={() => handleUpdateStatus(item.id, 'Skipped')}
                      >
                        <X size={14} color="#EF4444" />
                        <Text style={styles.btnTextSkip}>Skip</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnDeliver]}
                        onPress={() => handleUpdateStatus(item.id, 'Delivered')}
                      >
                        <Check size={14} color="#FFFFFF" />
                        <Text style={styles.btnTextDeliver}>Mark Delivered</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
                                <Image source={paper.src} style={{ width: 44, height: 44 }} resizeMode="contain" />
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

        {/* ── Agents Tab ── */}
        {activeTab === 'agents' && (
          <View style={styles.container}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Delivery Agents</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 }}>{agentsList.length} agents in Bengaluru</Text>
              </View>
              <TouchableOpacity
                style={styles.addPaperBtn}
                onPress={() => setIsAddingAgent(!isAddingAgent)}
                activeOpacity={0.8}
              >
                <UserPlus size={15} color="#FFFFFF" />
                <Text style={styles.addPaperBtnText}>{isAddingAgent ? 'Cancel' : 'Add Agent'}</Text>
              </TouchableOpacity>
            </View>

            {/* Inline add-agent form */}
            {isAddingAgent && (
              <View style={styles.agentFormBox}>
                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 14 }]}>New Delivery Agent</Text>

                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Akhil KS"
                  value={newAgent.name}
                  onChangeText={t => setNewAgent({ ...newAgent, name: t })}
                />

                <Text style={styles.inputLabel}>Mobile Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 9972505709"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={newAgent.phone}
                  onChangeText={t => setNewAgent({ ...newAgent, phone: t })}
                />

                <Text style={styles.inputLabel}>Area (Delivery Zone) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Mahalakshmi Layout"
                  value={newAgent.area}
                  onChangeText={t => setNewAgent({ ...newAgent, area: t })}
                />

                <Text style={styles.inputLabel}>Location / Sector</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. North Bengaluru"
                  value={newAgent.location}
                  onChangeText={t => setNewAgent({ ...newAgent, location: t })}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddAgent} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>Save Agent</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Agent cards */}
            {agentsList.map(agent => (
              <View key={agent.id} style={styles.agentCard}>
                {/* Avatar */}
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>
                    {agent.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.custName}>{agent.name}</Text>
                    <View style={[styles.badge, { backgroundColor: agent.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
                      <Text style={[styles.badgeText, { color: agent.isActive ? '#065F46' : '#991B1B' }]}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <MapPin size={11} color="#64748B" />
                    <Text style={styles.custAddress}>{agent.area}</Text>
                  </View>

                  {agent.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={11} color="#94A3B8" />
                      <Text style={[styles.custAddress, { color: '#94A3B8' }]}>{agent.location}</Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <View style={styles.agentPhonePill}>
                      <Phone size={12} color="#2563EB" />
                      <Text style={styles.agentPhoneText}>{agent.phone}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteAgentBtn}
                      onPress={() => handleDeleteAgent(agent.id)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={13} color="#EF4444" />
                      <Text style={styles.deleteAgentBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
              {['Kannada', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Hindi'].map((lang) => (
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
                  {['Kannada', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Hindi'].map((lang) => (
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
                      defaultSource={IMAGES['vijayavani.png'] as any}
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

      {/* ── Agents Tab ── */}
      {activeTab === 'agents' && false /* rendered inside ScrollView below */ && null}

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

  custCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  paperLogoBox: {
    width: 56,
    height: 56,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  custName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  custAddress: { fontSize: 12, color: '#64748B', flex: 1 },
  custMeta: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },

  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDelivered: { backgroundColor: '#D1FAE5' },
  badgeSkipped: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
  badgeTextDelivered: { color: '#065F46' },
  badgeTextSkipped: { color: '#991B1B' },

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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
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

  /* ── Agent styles ── */
  agentFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  agentAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  agentAvatarText: { fontSize: 15, fontWeight: '800', color: '#2563EB' },
  agentPhonePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE',
  },
  agentPhoneText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  deleteAgentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#FECACA',
  },
  deleteAgentBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
});
