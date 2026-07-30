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
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import {
  User,
  MapPin,
  Phone,
  LogOut,
  CheckCircle2,
  Calendar,
  CreditCard,
  Bell,
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
} from 'lucide-react-native';
import { store } from '../../../utils/store';

export default function ProfileScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [loadingGps, setLoadingGps] = useState(false);

  // Editable fields in modal
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
    });
    return unsubscribe;
  }, []);

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

      if (geo.length > 0) {
        const a = geo[0];
        const parts = [];
        if (a.name && !a.name.includes('+') && isNaN(Number(a.name))) parts.push(a.name);
        if (a.street && a.street !== a.name) parts.push(a.street);
        if (a.district) parts.push(a.district); else if (a.subregion) parts.push(a.subregion);
        if (a.city) parts.push(a.city);
        if (a.postalCode) parts.push(a.postalCode);

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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          store.setUser(null);
          router.replace('/customer/login');
        },
      },
    ]);
  };

  const handleSupport = () => {
    Linking.openURL('tel:9972505709');
  };

  const userDeliveries = deliveries.filter((d) => d.name === user?.name);
  const activeCount = userDeliveries.length;
  const totalMonthlyCost = userDeliveries.reduce((acc, d) => acc + (d.priceMonth || 180), 0);

  const getInitials = (str?: string) => {
    if (!str) return 'PF';
    const parts = str.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

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
              <View style={styles.proBadge}>
                <Sparkles size={10} color="#D97706" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
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
              <Newspaper size={18} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Papers</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <CheckCircle2 size={18} color="#16A34A" />
            </View>
            <Text style={styles.statNumber}>₹{totalMonthlyCost}</Text>
            <Text style={styles.statLabel}>Monthly Cost</Text>
          </View>

        </View>

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

        {/* ── PREFERENCES ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Subscription Controls</Text>

          {/* Delivery Notifications */}
          <View style={styles.menuRow}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Bell size={18} color="#2563EB" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Morning Delivery Alert</Text>
              <Text style={styles.menuSub}>Get notified when paper arrives</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={notifEnabled ? '#2563EB' : '#94A3B8'}
            />
          </View>

          <View style={styles.itemSeparator} />

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
              <Text style={styles.menuSub}>Contact Akhil K S (Agent/Owner)</Text>
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
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
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
});
