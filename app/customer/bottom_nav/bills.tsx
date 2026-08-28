import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../../database/storageHelper';
import { updateCustomerBill, listenUser } from '../../../database/users';
import { store } from '../../../utils/store';
import {
  FileText,
  CreditCard,
  UploadCloud,
  Clock,
  CheckCircle,
  ChevronDown,
  Receipt,
  X,
} from 'lucide-react-native';

export default function BillsScreen() {
  const [user, setUser] = useState(store.getUser() as any);
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');
  const [isPaymentAmountModalOpen, setIsPaymentAmountModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [billForPayment, setBillForPayment] = useState<any>(null);

  useEffect(() => {
    // Listen to store for user info updates
    const unsubStore = store.subscribe(() => {
      const u = store.getUser() as any;
      setUser(u);
      if (u?.bills) setBills(u.bills);
    });

    // Also directly listen to Firestore for this user's doc
    // This guarantees bills appear even if store listener hasn't merged yet
    const currentUser = store.getUser();
    let unsubFirestore: (() => void) | null = null;
    if (currentUser?.phone) {
      unsubFirestore = listenUser(currentUser.phone, (doc) => {
        if (doc && (doc as any).bills) {
          setBills((doc as any).bills);
        }
      });
    }

    return () => {
      unsubStore();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const unpaidBills = user ? bills.filter((b: any) => b.status !== 'Paid') : [];
  const paidBills = user ? bills
    .filter((b: any) => b.status === 'Paid')
    .sort((a: any, b: any) => new Date(b.paidAt || b.date || 0).getTime() - new Date(a.paidAt || a.date || 0).getTime()) : [];

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

    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Please grant gallery permission to upload a screenshot.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0].uri) return;

      setIsUploading(true);
      const publicUrl = await uploadImage(result.assets[0].uri, `payment_screenshots/${user?.phone}_${Date.now()}.jpg`);

      const updatedBills = bills.map((b: any) =>
        b.id === billForPayment.id ? { ...b, paymentProof: publicUrl, paidAmount: Number(paymentAmount) } : b
      );
      await updateCustomerBill(user?.phone, updatedBills);
      
      setIsPaymentAmountModalOpen(false);
      setPaymentAmount('');
      setBillForPayment(null);
      Alert.alert('Uploaded!', 'Screenshot sent. Admin will verify and mark your bill as paid.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bills</Text>
        <Text style={styles.headerSub}>{user.name}</Text>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unpaid' && styles.activeTab]}
          onPress={() => setActiveTab('unpaid')}
        >
          <Text style={[styles.tabText, activeTab === 'unpaid' && styles.activeTabText]}>
            Unpaid {unpaidBills.length > 0 ? `(${unpaidBills.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'unpaid' && (
          <>
            {unpaidBills.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CheckCircle size={48} color="#10B981" />
                <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
                <Text style={styles.emptySub}>You have no pending bills right now.</Text>
              </View>
            ) : (
              unpaidBills.map((bill: any) => (
                <View key={bill.id} style={styles.billCard}>
                  {/* Bill Header */}
                  <View style={styles.billTopRow}>
                    <View>
                      <Text style={styles.billMonth}>{bill.month}</Text>
                      <Text style={styles.billDate}>
                        Issued: {new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.amountBadge}>
                      <Text style={styles.amountText}>₹{bill.totalAmount}</Text>
                    </View>
                  </View>

                  {/* Items Preview */}
                  {(bill.items || []).map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemAmount}>₹{item.amount}</Text>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  {bill.paymentProof ? (
                    <View style={styles.pendingBadge}>
                      <Clock size={14} color="#B45309" />
                      <Text style={styles.pendingText}>Screenshot uploaded — Awaiting admin verification</Text>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => Linking.openURL(`upi://pay?pa=9972505709@ibl&pn=Newspaper%20Delivery&am=${bill.totalAmount}&cu=INR`)}
                      >
                        <CreditCard size={15} color="#FFF" />
                        <Text style={styles.payBtnText}>Pay ₹{bill.totalAmount} via UPI</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={() => handleUploadScreenshot(bill)}
                        disabled={isUploading}
                      >
                        <UploadCloud size={15} color="#2563EB" />
                        <Text style={styles.uploadBtnText}>{isUploading ? 'Uploading…' : 'Upload Screenshot'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={styles.viewBillBtn} onPress={() => setSelectedBill(bill)}>
                    <FileText size={14} color="#475569" />
                    <Text style={styles.viewBillText}>View Bill</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {paidBills.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Receipt size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No History Yet</Text>
                <Text style={styles.emptySub}>Paid bills will show up here.</Text>
              </View>
            ) : (
              paidBills.map((bill: any) => (
                <View key={bill.id} style={[styles.billCard, styles.paidBillCard]}>
                  <View style={styles.billTopRow}>
                    <View>
                      <Text style={[styles.billMonth, { color: '#166534' }]}>{bill.month}</Text>
                      <Text style={styles.billDate}>
                        Paid: {new Date(bill.paidAt || bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.amountBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.amountText, { color: '#15803D' }]}>₹{bill.totalAmount}</Text>
                    </View>
                  </View>
                  <View style={styles.paidRow}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.paidLabel}>Payment Verified by Admin</Text>
                  </View>
                  <TouchableOpacity style={styles.viewBillBtn} onPress={() => setSelectedBill(bill)}>
                    <FileText size={14} color="#475569" />
                    <Text style={styles.viewBillText}>View Bill</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Payment Amount Modal */}
      <Modal visible={isPaymentAmountModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="#2563EB" />
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Enter Payment Amount</Text>
              </View>
              <TouchableOpacity
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  setIsPaymentAmountModalOpen(false);
                  setPaymentAmount('');
                  setBillForPayment(null);
                }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Amount Paid (₹)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#64748B', marginRight: 8 }}>₹</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A' }}
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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  setIsPaymentAmountModalOpen(false);
                  setPaymentAmount('');
                  setBillForPayment(null);
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 2, height: 48, borderRadius: 14, backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
                onPress={handleProcessPaymentUpload}
                disabled={isUploading}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>{isUploading ? 'Uploading...' : 'Upload Screenshot'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DMart Style Bill Modal */}
      <Modal visible={!!selectedBill} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptPaper}>
            {selectedBill && (
              <>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                  <Text style={styles.receiptHeader}>NEWSPAPER DELIVERY</Text>
                  <Text style={styles.receiptSubHeader}>TAX INVOICE</Text>
                  <Text style={styles.dashedLine}>----------------------------------------</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.receiptMeta}>BILL NO: {selectedBill.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.receiptMeta}>DATE: {new Date(selectedBill.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.receiptMeta}>CUSTOMER: {user?.name?.toUpperCase()}</Text>
                  <Text style={styles.receiptMeta}>MONTH: {selectedBill.month?.toUpperCase()}</Text>
                  <Text style={styles.dashedLine}>----------------------------------------</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[styles.receiptMeta, { fontWeight: '700' }]}>ITEM</Text>
                    <Text style={[styles.receiptMeta, { fontWeight: '700' }]}>AMOUNT</Text>
                  </View>
                  {(selectedBill.items || []).map((item: any) => (
                    <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={styles.receiptMeta}>{item.name.toUpperCase()}</Text>
                      <Text style={styles.receiptMeta}>₹{Number(item.amount).toFixed(2)}</Text>
                    </View>
                  ))}
                  <Text style={styles.dashedLine}>----------------------------------------</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                    <Text style={[styles.receiptMeta, { fontSize: 16, fontWeight: '800' }]}>NET AMOUNT</Text>
                    <Text style={[styles.receiptMeta, { fontSize: 16, fontWeight: '800' }]}>₹{Number(selectedBill.totalAmount).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.dashedLine}>----------------------------------------</Text>
                  <Text style={[styles.receiptMeta, { textAlign: 'center', marginTop: 12, fontWeight: '700' }]}>*** THANK YOU ***</Text>
                  <Text style={[styles.receiptMeta, { textAlign: 'center', marginTop: 4, fontSize: 10 }]}>Please pay via UPI on the main screen</Text>
                </ScrollView>
                <View style={styles.receiptFooter}>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedBill(null)}>
                    <Text style={styles.closeBtnText}>CLOSE BILL</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  tab: {
    paddingBottom: 12,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#2563EB', fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  billCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paidBillCard: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  billTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  billMonth: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  billDate: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  amountBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  amountText: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: 13, color: '#475569', fontWeight: '500' },
  itemAmount: { fontSize: 13, color: '#0F172A', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  pendingText: { fontSize: 12, color: '#92400E', fontWeight: '600', marginLeft: 8, flex: 1 },
  actionRow: { gap: 8, marginBottom: 10 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  payBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  uploadBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  viewBillBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 12, 
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewBillText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  paidLabel: { fontSize: 13, color: '#15803D', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  receiptPaper: {
    width: '100%',
    backgroundColor: '#FAFAFA', // Slight off-white paper color
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000',
    letterSpacing: 1,
  },
  receiptSubHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: '#374151',
    marginTop: 4,
    marginBottom: 8,
  },
  dashedLine: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 1,
    marginVertical: 6,
    textAlign: 'center',
  },
  receiptMeta: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    fontSize: 13, 
    color: '#111827', 
    marginBottom: 4,
    fontWeight: '600',
  },
  receiptFooter: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeBtn: { backgroundColor: '#111827', padding: 14, borderRadius: 8, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
