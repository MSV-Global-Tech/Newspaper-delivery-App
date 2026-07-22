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
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { IMAGES } from '../assets/images';
import { store } from '../utils/store';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'papers' | 'access'>('overview');
  const [search, setSearch] = useState('');
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [papersList, setPapersList] = useState(store.getPapers());
  const [adminNumbers, setAdminNumbers] = useState(store.getAdminNumbers());
  const [newAdminPhone, setNewAdminPhone] = useState('');

  // Add Paper State
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [newPaper, setNewPaper] = useState({ name: '', language: '', priceDay: '', priceMonth: '', imageUrl: '' });

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setDeliveries(store.getDeliveries());
      setPapersList(store.getPapers());
      setAdminNumbers(store.getAdminNumbers());
    });
    return unsubscribe;
  }, []);

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

  const handleAddPaper = () => {
    if (!newPaper.name || !newPaper.language || !newPaper.priceDay || !newPaper.priceMonth) return;
    store.addPaper({
      name: newPaper.name,
      language: newPaper.language,
      priceDay: parseFloat(newPaper.priceDay),
      priceMonth: parseFloat(newPaper.priceMonth),
      src: newPaper.imageUrl ? { uri: newPaper.imageUrl } : IMAGES.vijayavani, // fallback placeholder
    });
    setNewPaper({ name: '', language: '', priceDay: '', priceMonth: '', imageUrl: '' });
    setIsAddingPaper(false);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Delivered' | 'Skipped') => {
    store.updateDeliveryStatus(id, newStatus);
  };

  const handleLogout = () => {
    store.setUser(null);
    router.replace('/login');
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
      <View style={styles.tabBar}>
        {(['overview', 'deliveries', 'papers', 'access'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
                  onPress={() => router.push(`/delivery/${item.id}`)}
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
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Manage Publications</Text>
              <TouchableOpacity style={styles.addPaperBtn} onPress={() => setIsAddingPaper(true)}>
                <PlusCircle size={16} color="#FFFFFF" />
                <Text style={styles.addPaperBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {papersList.map((paper) => (
              <View key={paper.id} style={styles.paperCatalogItem}>
                <Image source={paper.src} style={{ width: 64, height: 64 }} resizeMode="contain" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.custName}>{paper.name}</Text>
                  <Text style={styles.custAddress}>{paper.language}  •  ₹{paper.priceMonth}/mo</Text>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'access' && (
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Manage Admin Access</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter 10-digit phone"
                keyboardType="number-pad"
                maxLength={10}
                value={newAdminPhone}
                onChangeText={setNewAdminPhone}
              />
              <TouchableOpacity
                style={[styles.addPaperBtn, { borderRadius: 12 }]}
                onPress={() => {
                  if (newAdminPhone.length === 10) {
                    store.addAdminNumber(newAdminPhone);
                    setNewAdminPhone('');
                  }
                }}
              >
                <PlusCircle size={16} color="#FFFFFF" />
                <Text style={styles.addPaperBtnText}>Add Admin</Text>
              </TouchableOpacity>
            </View>

            {adminNumbers.map(phone => (
              <View key={phone} style={styles.paperCatalogItem}>
                <View style={[styles.paperLogoBox, { backgroundColor: '#F1F5F9', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }]}>
                  <Users size={20} color="#64748B" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.custName}>Admin User</Text>
                  <Text style={styles.custAddress}>+91 {phone}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: '#FEF2F2' }]}
                  onPress={() => store.removeAdminNumber(phone)}
                >
                  <Text style={[styles.editBtnText, { color: '#EF4444' }]}>Revoke</Text>
                </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Add New Newspaper</Text>
              <TouchableOpacity onPress={() => setIsAddingPaper(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Newspaper Name</Text>
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

            <Text style={styles.inputLabel}>Newspaper Image</Text>
            {newPaper.imageUrl ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Image source={{ uri: newPaper.imageUrl }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                <TouchableOpacity onPress={() => setNewPaper({ ...newPaper, imageUrl: '' })} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <ImageIcon size={20} color="#64748B" />
                <Text style={styles.imagePickerText}>Select from Gallery</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddPaper}>
              <Text style={styles.saveBtnText}>Save Newspaper</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#F1F5F9' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },

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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
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
