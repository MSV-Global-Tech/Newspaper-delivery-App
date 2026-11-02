import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform, Linking, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, UploadCloud, CheckCircle, Clock, FileText, ArrowLeft, ChevronDown, ChevronUp, X, CreditCard } from 'lucide-react-native';
import { store, User } from '../../utils/store';
import { updateVendor, VendorDoc, VendorPayment, VendorBill, VendorBillItem } from '../../database/vendors';
import { uploadImage } from '../../database/storageHelper';
import { setSessionUser } from '../../utils/session';
import { setAdminOverviewSnapshot } from '../../utils/session';

const DashedLine = () => (
  <Text style={{ color: '#9CA3AF', marginVertical: 8, fontSize: 14, opacity: 0.7 }} numberOfLines={1} ellipsizeMode="clip">
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  </Text>
);

export default function VendorDashboard() {
  const user = store.getUser();
  const [vendor, setVendor] = useState<VendorDoc | null>(user?.vendorData || null);
  const [uploading, setUploading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [isPaymentAmountModalOpen, setIsPaymentAmountModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const u = store.getUser();
      if (u?.isVendor && u.vendorData) {
        // Enforce single-device login
        if (u.sessionToken && u.vendorData.currentSessionToken && u.sessionToken !== u.vendorData.currentSessionToken) {
          Alert.alert('Session Expired', 'You have been logged out because another device logged in with this code.');
          store.setUser(null);
          setSessionUser(null);
          router.replace('/customer/login');
          return;
        }
        setVendor(u.vendorData);
      }
    });
    return unsubscribe;
  }, []);

  if (!user || !user.isVendor || !vendor) {
    return (
      <SafeAreaView style={s.center}>
        <Text>Not authorized</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/vendor/login')}>
          <Text style={s.btnTxt}>Go to Vendor Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    store.setUser(null);
    setSessionUser(null);
    setAdminOverviewSnapshot(null);
    router.replace('/vendor/login');
  };

  const handleUploadScreenshot = async () => {
    setPaymentAmount(vendor.paymentAmount?.toString() || '');
    setIsPaymentAmountModalOpen(true);
  };

  const handleProcessPaymentUpload = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.2, // Heavily compress to avoid Firestore 1MB document size limit
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const localUri = result.assets[0].uri;
        const timestamp = Date.now();

        // Upload the image
        const storagePath = `vendor_payments/${vendor.id}_${timestamp}`;
        const screenshotUrl = await uploadImage(localUri, storagePath);

        // Update Vendor's payment history with new Pending payment
        const newPayment: VendorPayment = {
          id: `pay_${timestamp}`,
          amount: Number(paymentAmount),
          date: new Date().toISOString(),
          status: 'Pending',
          screenshot: screenshotUrl,
        };

        await updateVendor(vendor.id, {
          paymentHistory: [newPayment, ...(vendor.paymentHistory || [])],
        });

        setIsPaymentAmountModalOpen(false);
        setPaymentAmount('');
        Alert.alert('Success', 'Payment screenshot uploaded! Waiting for admin approval.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to upload screenshot: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const totalDue = (vendor.bills || []).filter(b => b.status === 'Unpaid').reduce((sum, b) => sum + b.totalAmount, 0);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9972505709@ibl%26pn=Newspaper%20Delivery%26am=${totalDue}%26cu=INR`;

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello, {vendor.name}</Text>
          <Text style={s.subtitle}>Vendor Dashboard</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <LogOut size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* UPI Payment Section */}
        {totalDue > 0 && (
          <View style={s.upiCard}>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.upiTitle}>Pay Total Dues</Text>
              <Text style={s.upiText}>UPI ID: 9972505709@ibl</Text>
              <Text style={s.upiAmount}>₹{totalDue}</Text>
            </View>

            <View style={{ alignItems: 'center', marginTop: 15 }}>
              <Text style={{ fontSize: 13, color: '#475569', marginBottom: 10, fontWeight: '600' }}>Scan to Pay</Text>
              <Image source={{ uri: qrUrl }} style={{ width: 160, height: 160, borderRadius: 8, marginBottom: 10 }} />

              <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 }} />

              <TouchableOpacity
                style={[s.payNowBtn, { width: '100%' }]}
                onPress={() => Linking.openURL(`upi://pay?pa=9972505709@ibl&pn=Newspaper%20Delivery&am=${totalDue}&cu=INR`)}
              >
                <Text style={s.payNowTxt}>Pay via UPI App</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Detailed Bills Section */}
        <Text style={s.sectionTitle}>My Bills</Text>
        {(() => {
          const unpaidBills = (vendor.bills || []).filter(b => b.status !== 'Paid');
          if (unpaidBills.length === 0) {
            return <Text style={s.emptyTxt}>No active/unpaid bills.</Text>;
          }
          return unpaidBills.map((bill) => {
            const isPaid = bill.status === 'Paid';
            const isPending = bill.status === 'Pending Approval';
            return (
              <View key={bill.id} style={s.card}>
                <View style={s.billHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.billMonth}>{bill.month}</Text>
                    <Text style={[s.billStatus, isPaid ? s.cGreen : isPending ? s.cOrange : s.cRed]}>{bill.status}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={s.totalValue}>₹{bill.totalAmount}</Text>
                    <TouchableOpacity style={s.viewBillBtn} onPress={() => setSelectedBill(bill)}>
                      <Text style={s.viewBillTxt}>View Bill</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          });
        })()}

        {/* Upload Button */}
        <TouchableOpacity
          style={[s.uploadBtn, uploading && s.uploadBtnDisabled]}
          onPress={handleUploadScreenshot}
          disabled={uploading}
        >
          <UploadCloud size={24} color="#FFF" />
          <Text style={s.uploadBtnTxt}>{uploading ? 'Uploading...' : 'Upload Payment Screenshot'}</Text>
        </TouchableOpacity>

        {/* Payment History */}
        <Text style={s.sectionTitle}>Payment History</Text>
        {(() => {
          const paidBills = (vendor.bills || []).filter(b => b.status === 'Paid').map(b => ({
            id: b.id,
            amount: b.totalAmount,
            date: b.paidAt || b.date,
            status: 'Approved',
            screenshot: b.paymentProof,
            isBill: true,
            title: `Bill: ${b.month}`
          }));
          const legacyPayments = (vendor.paymentHistory || []).map(p => ({
            ...p,
            isBill: false,
            title: 'Manual Payment'
          }));
          const combinedHistory = [...paidBills, ...legacyPayments].sort((a, b) => {
            const dA = a.date ? new Date(a.date).getTime() : 0;
            const dB = b.date ? new Date(b.date).getTime() : 0;
            return dB - dA;
          });

          if (combinedHistory.length === 0) {
            return <Text style={s.emptyTxt}>No payments recorded yet.</Text>;
          }

          return combinedHistory.map((payment) => (
            <View key={payment.id} style={s.historyCard}>
              <View style={s.historyLeft}>
                {payment.status === 'Approved' ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : payment.status === 'Rejected' ? (
                  <LogOut size={24} color="#EF4444" />
                ) : (
                  <Clock size={24} color="#F59E0B" />
                )}
                <View style={{ marginLeft: 12 }}>
                  <Text style={[s.historyAmount, { fontSize: 13, color: '#6B7280', marginBottom: 2 }]}>{payment.title}</Text>
                  <Text style={s.historyAmount}>₹{payment.amount}</Text>
                  <Text style={s.historyDate}>
                    {payment.date ? (!isNaN(new Date(payment.date).getTime()) ? new Date(payment.date).toLocaleDateString() : 'Invalid') : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={s.historyRight}>
                <Text style={[
                  s.statusTxt,
                  payment.status === 'Approved' && { color: '#10B981', backgroundColor: '#D1FAE5' },
                  payment.status === 'Rejected' && { color: '#EF4444', backgroundColor: '#FEE2E2' },
                ]}>
                  {payment.isBill ? 'Paid' : payment.status}
                </Text>
                {payment.screenshot && (
                  <TouchableOpacity onPress={() => Alert.alert('Proof', 'Image exists in DB.')}>
                    <FileText size={20} color="#2563EB" style={{ marginTop: 8, alignSelf: 'flex-end' }} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ));
        })()}

      </ScrollView>

      {/* View Bill Modal */}
      <Modal visible={!!selectedBill} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {selectedBill && (
              <View style={s.receiptContainer}>
                <ScrollView contentContainerStyle={s.receiptBody} showsVerticalScrollIndicator={false}>
                  <Text style={s.receiptHeader}>NEWSPAPER BILL</Text>

                  <DashedLine />

                  <View style={s.receiptMetaRow}>
                    <Text style={s.receiptMetaText}>BILL NO: {selectedBill.id.substring(selectedBill.id.length - 6).toUpperCase()}</Text>
                    <Text style={s.receiptMetaText}>DATE: {new Date(selectedBill.date).toLocaleDateString()}</Text>
                  </View>

                  <Text style={s.receiptMetaText}>VENDOR: {vendor.name.toUpperCase()}</Text>

                  <DashedLine />

                  <View style={s.receiptTableHead}>
                    <Text style={[s.receiptTableText, { flex: 2, fontWeight: '700' }]}>ITEM</Text>
                    <Text style={[s.receiptTableText, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>AMOUNT</Text>
                  </View>

                  <DashedLine />

                  {(selectedBill.items || []).map(item => (
                    <View key={item.id} style={s.receiptTableRow}>
                      <Text style={[s.receiptTableText, { flex: 2 }]}>{item.name.toUpperCase()}</Text>
                      <Text style={[s.receiptTableText, { flex: 1, textAlign: 'right' }]}>{item.amount.toFixed(2)}</Text>
                    </View>
                  ))}

                  <DashedLine />

                  <View style={s.receiptTotalRow}>
                    <Text style={s.receiptTotalLabel}>TOTAL AMOUNT</Text>
                    <Text style={s.receiptTotalValue}>₹{selectedBill.totalAmount.toFixed(2)}</Text>
                  </View>

                  <DashedLine />

                  <Text style={s.receiptFooter}>* Terms & conditions apply *</Text>
                </ScrollView>

                <View style={s.modalActions}>
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setSelectedBill(null)}>
                    <Text style={s.modalCloseTxt}>Close</Text>
                  </TouchableOpacity>
                  {selectedBill.status !== 'Paid' && (
                    <TouchableOpacity
                      style={s.modalPayBtn}
                      onPress={() => Linking.openURL(`upi://pay?pa=9972505709@ibl&pn=Newspaper%20Delivery&am=${selectedBill.totalAmount}&cu=INR`)}
                    >
                      <Text style={s.modalPayTxt}>Pay ₹{selectedBill.totalAmount}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Amount Modal */}
      <Modal visible={isPaymentAmountModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="#2563EB" />
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Enter Payment Amount</Text>
              </View>
              <TouchableOpacity
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  setIsPaymentAmountModalOpen(false);
                  setPaymentAmount('');
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
              {vendor && (
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                  Due Amount: ₹{vendor.paymentAmount}
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  setIsPaymentAmountModalOpen(false);
                  setPaymentAmount('');
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 2, height: 48, borderRadius: 14, backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
                onPress={handleProcessPaymentUpload}
                disabled={uploading}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>{uploading ? 'Uploading...' : 'Upload Screenshot'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  logoutBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  content: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },

  upiCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  upiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  upiTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  upiText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  upiAmount: { fontSize: 24, fontWeight: '900', color: '#059669' },
  payNowBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  payNowTxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billMonth: { fontSize: 14, fontWeight: '800', color: '#111827' },
  billStatus: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  cGreen: { color: '#10B981' }, cRed: { color: '#EF4444' }, cOrange: { color: '#F59E0B' },
  viewBillBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  viewBillTxt: { color: '#2563EB', fontSize: 11, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, maxHeight: '80%' },
  modalActions: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  modalCloseBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#E5E7EB', borderRadius: 8, alignItems: 'center' },
  modalCloseTxt: { color: '#374151', fontSize: 14, fontWeight: '700' },
  modalPayBtn: { flex: 2, paddingVertical: 12, backgroundColor: '#10B981', borderRadius: 8, alignItems: 'center' },
  modalPayTxt: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  receiptContainer: { backgroundColor: '#FDFBF7', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', maxHeight: '100%' },
  receiptBody: { paddingHorizontal: 16, paddingVertical: 20 },
  receiptHeader: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#111827', letterSpacing: 1 },
  receiptSub: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, textAlign: 'center', color: '#6B7280', marginBottom: 4 },
  receiptMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptMetaText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: '#374151', marginBottom: 4, textTransform: 'uppercase' },
  receiptTableHead: { flexDirection: 'row', marginBottom: 2 },
  receiptTableRow: { flexDirection: 'row', marginBottom: 6 },
  receiptTableText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#111827' },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  receiptTotalLabel: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: '800', color: '#111827' },
  receiptTotalValue: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16, fontWeight: '800', color: '#111827' },
  receiptFooter: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, textAlign: 'center', color: '#6B7280', marginTop: 4 },

  totalValue: { fontSize: 16, color: '#2563EB', fontWeight: '900' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', padding: 12, borderRadius: 10, gap: 8, marginBottom: 20, marginTop: 10 },
  uploadBtnDisabled: { opacity: 0.7 },
  uploadBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  emptyTxt: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 8 },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  historyDate: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  statusTxt: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, backgroundColor: '#FEF3C7', color: '#B45309' },
  btn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8, marginTop: 12 },
  btnTxt: { color: '#FFF', fontWeight: '700' },
});
