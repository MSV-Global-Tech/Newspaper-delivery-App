import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, Platform, Image
} from 'react-native';
import { X, PlusCircle, CheckCircle, Clock, Search, Trash2, ChevronRight, Eye, Calendar } from 'lucide-react-native';
import { updateCustomerBill } from '../database/users';
import DateTimePicker from '@react-native-community/datetimepicker';
import { store } from '../utils/store';

interface AdminCustomerBillingModalProps {
  visible: boolean;
  customer: any;
  onClose: () => void;
}

export default function AdminCustomerBillingModal({ visible, customer, onClose }: AdminCustomerBillingModalProps) {
  const [view, setView] = useState<'bills' | 'generate'>('bills');
  const [billDate, setBillDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [billItems, setBillItems] = useState<{ id: string; name: string; amount: string }[]>([
    { id: Date.now().toString(), name: '', amount: '' }
  ]);
  const [showPaperPicker, setShowPaperPicker] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [paperSearch, setPaperSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [selectedBillForScreenshot, setSelectedBillForScreenshot] = useState<any>(null);
  const [customerPapers, setCustomerPapers] = useState<string[]>([]);

  // Get customer's subscribed papers
  useEffect(() => {
    if (visible && customer?.phone) {
      const deliveries = store.getDeliveries();
      const customerDeliveries = deliveries.filter((d) => d?.name === customer?.name && d?.phone === customer?.phone);
      const subscribedPapers = [...new Set(customerDeliveries.map((d) => d?.paperName).filter(Boolean))];
      setCustomerPapers(subscribedPapers);
      
      // If customer has only one subscription, auto-fill the first item
      if (subscribedPapers.length === 1 && billItems.length === 1 && !billItems[0].name) {
        setBillItems([{ id: Date.now().toString(), name: subscribedPapers[0], amount: '' }]);
      }
    }
  }, [visible, customer?.phone, customer?.name]);

  // Reset form when customer changes
  useEffect(() => {
    if (visible) {
      setView('bills');
      resetForm();
    }
  }, [visible, customer?.phone]);

  if (!visible || !customer) return null;

  const resetForm = () => {
    setBillDate(new Date());
    setBillItems([{ id: Date.now().toString(), name: '', amount: '' }]);
  };

  const allBills: any[] = customer.bills || [];
  const unpaidBills = allBills.filter((b: any) => b.status !== 'Paid');
  const paidBills = allBills.filter((b: any) => b.status === 'Paid');

  const totalAmount = billItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  const openPaperPicker = (id: string) => {
    if (customerPapers.length === 0) {
      Alert.alert('No Subscriptions', 'This customer has no active subscriptions. Please have them subscribe to newspapers first before generating bills.');
      return;
    }
    setPickerTargetId(id);
    setPaperSearch('');
    setShowPaperPicker(true);
  };

  const selectPaper = (paper: string) => {
    if (pickerTargetId) {
      setBillItems(prev => prev.map(i => i.id === pickerTargetId ? { ...i, name: paper } : i));
    }
    setShowPaperPicker(false);
    setPickerTargetId(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setBillDate(selectedDate);
  };

  const addBillItem = () => {
    setBillItems(prev => [...prev, { id: Date.now().toString(), name: '', amount: '' }]);
  };

  const removeBillItem = (id: string) => {
    if (billItems.length > 1) setBillItems(prev => prev.filter(i => i.id !== id));
  };

  const updateBillItem = (id: string, field: 'name' | 'amount', value: string) => {
    setBillItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleGenerateBill = async () => {
    const validItems = billItems
      .filter(i => i.name.trim() && parseFloat(i.amount) > 0)
      .map(i => ({ id: i.id, name: i.name.trim(), amount: parseFloat(i.amount) }));
    if (validItems.length === 0) { Alert.alert('Error', 'Please add at least one item with a valid amount.'); return; }

    const formattedDate = billDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const newBill = {
      id: `bill_${Date.now()}`,
      month: formattedDate,
      date: billDate.toISOString(),
      items: validItems,
      totalAmount: validItems.reduce((s, i) => s + i.amount, 0),
      status: 'Unpaid',
    };

    try {
      setSaving(true);
      await updateCustomerBill(customer.phone, [newBill, ...allBills]);
      Alert.alert('Success', 'Bill created! Customer will see it in their app.');
      resetForm();
      setView('bills');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePaid = async (bill: any) => {
    const newStatus = bill.status === 'Paid' ? 'Unpaid' : 'Paid';
    Alert.alert(
      newStatus === 'Paid' ? 'Mark as Paid' : 'Mark as Unpaid',
      `Mark "${bill.month}" (₹${bill.totalAmount}) as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus,
          onPress: async () => {
            setMarkingId(bill.id);
            try {
              const updated = allBills.map((b: any) =>
                b.id === bill.id
                  ? { ...b, status: newStatus, paidAt: newStatus === 'Paid' ? new Date().toISOString() : undefined }
                  : b
              );
              await updateCustomerBill(customer.phone, updated);
            } catch (e: any) { Alert.alert('Error', e.message); }
            finally { setMarkingId(null); }
          }
        }
      ]
    );
  };

  const handleViewScreenshot = (screenshotUrl: string, bill: any) => {
    setSelectedScreenshotUrl(screenshotUrl);
    setSelectedBillForScreenshot(bill);
    setShowScreenshotModal(true);
  };

  const filteredPapers = customerPapers.filter(p => p.toLowerCase().includes(paperSearch.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>{customer.name}</Text>
              <Text style={s.headerSub}>{customer.phone}</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Top Action Row */}
          <View style={s.topActions}>
            <TouchableOpacity style={[s.topTab, view === 'bills' && s.topTabActive]} onPress={() => setView('bills')}>
              <Text style={[s.topTabTxt, view === 'bills' && s.topTabTxtActive]}>Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.topTab, view === 'generate' && s.topTabActive]} onPress={() => setView('generate')}>
              <Text style={[s.topTabTxt, view === 'generate' && s.topTabTxtActive]}>+ New Bill</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* ── Bills View ── */}
            {view === 'bills' && (
              <>
                {/* Unpaid Bills */}
                <Text style={s.sectionLabel}>Active Bills</Text>
                {unpaidBills.length === 0 ? (
                  <Text style={s.emptyTxt}>No unpaid bills.</Text>
                ) : (
                  unpaidBills.map((bill: any, index: number) => (
                    <View key={bill.id} style={[s.billRow, index > 0 && { marginTop: 10 }]}>
                      <View style={[s.dot, { backgroundColor: '#EF4444' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.billAmount}>₹{bill.totalAmount} <Text style={s.billMonthTxt}>({bill.month})</Text></Text>
                        <Text style={s.billMeta}>{(bill.items || []).length} item{(bill.items || []).length !== 1 ? 's' : ''}</Text>
                        {bill.paymentProof && (
                          <TouchableOpacity 
                            style={s.proofBadge} 
                            onPress={() => handleViewScreenshot(bill.paymentProof, bill)}
                            activeOpacity={0.7}
                          >
                            <Eye size={11} color="#B45309" />
                            <Text style={s.proofTxt}>View Payment Screenshot</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={s.billStatusTxt}>Unpaid</Text>
                      </View>
                      <TouchableOpacity
                        style={s.markPaidBtn}
                        onPress={() => handleTogglePaid(bill)}
                        disabled={markingId === bill.id}
                      >
                        <CheckCircle size={14} color="#FFF" />
                        <Text style={s.markPaidTxt}>{markingId === bill.id ? '...' : 'Mark Paid'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {/* Payment History */}
                <Text style={[s.sectionLabel, { marginTop: 20 }]}>Payment History</Text>
                {paidBills.length === 0 ? (
                  <Text style={s.emptyTxt}>No paid bills yet.</Text>
                ) : (
                  paidBills.map((bill: any, index: number) => (
                    <View key={bill.id} style={[s.billRow, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }, index > 0 && { marginTop: 10 }]}>
                      <View style={[s.dot, { backgroundColor: '#10B981' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.billAmount, { color: '#166534' }]}>₹{bill.totalAmount} <Text style={s.billMonthTxt}>({bill.month})</Text></Text>
                        <Text style={[s.billMeta, { color: '#15803D' }]}>
                          Paid: {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </Text>
                      </View>
                      <View style={s.paidBadge}>
                        <CheckCircle size={13} color="#065F46" />
                        <Text style={s.paidTxt}>Paid</Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* ── Generate Bill View ── */}
            {view === 'generate' && (
              <>
                <Text style={s.sectionLabel}>Billing Date</Text>
                <TouchableOpacity 
                  style={s.dateInput} 
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Calendar size={16} color="#2563EB" />
                  <Text style={s.dateText}>
                    {billDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={billDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <Text style={[s.sectionLabel, { marginTop: 12 }]}>Items</Text>
                {billItems.map((item, index) => (
                  <View key={item.id} style={s.itemRow}>
                    <TouchableOpacity style={[s.input, { flex: 2, marginRight: 8, justifyContent: 'center' }]} onPress={() => openPaperPicker(item.id)}>
                      <Text style={{ color: item.name ? '#0F172A' : '#94A3B8', fontSize: 14 }}>
                        {item.name || 'Select paper…'}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[s.input, { flex: 1, marginRight: 8 }]}
                      placeholder="₹ Amount"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={item.amount}
                      onChangeText={v => updateBillItem(item.id, 'amount', v)}
                    />
                    <TouchableOpacity onPress={() => removeBillItem(item.id)} style={s.removeBtn}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={s.addItemBtn} onPress={addBillItem}>
                  <PlusCircle size={16} color="#2563EB" />
                  <Text style={s.addItemTxt}>Add Another Item</Text>
                </TouchableOpacity>

                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total Amount</Text>
                  <Text style={s.totalAmt}>₹{totalAmount.toFixed(2)}</Text>
                </View>

                <TouchableOpacity style={[s.generateBtn, saving && { opacity: 0.7 }]} onPress={handleGenerateBill} disabled={saving}>
                  <Text style={s.generateBtnTxt}>{saving ? 'Saving…' : 'Send Bill to Customer'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Paper Picker Modal */}
      <Modal visible={showPaperPicker} transparent animationType="fade">
        <View style={s.pickerOverlay}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>Customer's Subscriptions</Text>
              <TouchableOpacity onPress={() => setShowPaperPicker(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {customerPapers.length > 0 && (
              <View style={s.pickerSearch}>
                <Search size={15} color="#94A3B8" />
                <TextInput
                  style={s.pickerSearchInput}
                  placeholder="Search subscriptions…"
                  placeholderTextColor="#94A3B8"
                  value={paperSearch}
                  onChangeText={setPaperSearch}
                  autoFocus
                />
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {customerPapers.length === 0 ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>
                    This customer has no active subscriptions yet.
                  </Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
                    Please have them subscribe to newspapers first.
                  </Text>
                </View>
              ) : (
                filteredPapers.map(paper => (
                  <TouchableOpacity key={paper} style={s.pickerItem} onPress={() => selectPaper(paper)}>
                    <Text style={s.pickerItemTxt}>{paper}</Text>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Screenshot Viewer Modal */}
      <Modal visible={showScreenshotModal} transparent animationType="fade">
        <View style={s.screenshotOverlay}>
          <View style={s.screenshotSheet}>
            <View style={s.screenshotHeader}>
              <Text style={s.screenshotTitle}>Payment Screenshot</Text>
              <TouchableOpacity onPress={() => setShowScreenshotModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
              {selectedScreenshotUrl && (
                <Image 
                  source={{ uri: selectedScreenshotUrl }} 
                  style={s.screenshotImage}
                  resizeMode="contain"
                />
              )}
              {selectedBillForScreenshot?.paidAmount && (
                <View style={s.paidAmountBadge}>
                  <Text style={s.paidAmountText}>Customer paid: ₹{selectedBillForScreenshot.paidAmount}</Text>
                </View>
              )}
            </ScrollView>
            <View style={s.screenshotFooter}>
              <TouchableOpacity 
                style={s.screenshotCloseBtn}
                onPress={() => setShowScreenshotModal(false)}
              >
                <Text style={s.screenshotCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: '65%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  closeBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  topActions: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  topTab: { paddingBottom: 12, marginRight: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabActive: { borderBottomColor: '#2563EB' },
  topTabTxt: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  topTabTxtActive: { color: '#2563EB', fontWeight: '700' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  emptyTxt: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 },
  billRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  billAmount: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  billMonthTxt: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  billMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  billStatusTxt: { fontSize: 11, fontWeight: '600', color: '#DC2626', marginTop: 2 },
  proofBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 4, gap: 4, alignSelf: 'flex-start' },
  proofTxt: { fontSize: 10, color: '#92400E', fontWeight: '600' },
  markPaidBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, gap: 4 },
  markPaidTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, gap: 4 },
  paidTxt: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0F172A' },
  dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, gap: 12 },
  dateText: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  removeBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 10 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 6 },
  addItemTxt: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#475569' },
  totalAmt: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  generateBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  generateBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  pickerSearch: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  pickerSearchInput: { flex: 1, padding: 10, fontSize: 14, color: '#0F172A' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  pickerItemTxt: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  screenshotOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  screenshotSheet: { backgroundColor: '#FFF', borderRadius: 16, width: '100%', maxHeight: '80%' },
  screenshotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  screenshotTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  screenshotImage: { width: '100%', height: 300, borderRadius: 8, marginBottom: 12 },
  paidAmountBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  paidAmountText: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  screenshotFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  screenshotCloseBtn: { backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  screenshotCloseBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
});
