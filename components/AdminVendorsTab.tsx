import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Image, Platform, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlusCircle, Clock, CheckCircle, FileText, X, ChevronRight, MapPin, Trash2, Search, Phone } from 'lucide-react-native';
import { store } from '../utils/store';
import { saveVendor, updateVendor, deleteVendor, VendorDoc, VendorBill, VendorBillItem } from '../database/vendors';

function safeDate(str?: string) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function generateCode(existingVendors: VendorDoc[]): string {
  let max = 0;
  for (const v of existingVendors) {
    const match = v.secretCode?.match(/^VEND(\d+)$/);
    if (match) { const n = parseInt(match[1], 10); if (n > max) max = n; }
  }
  return `VEND${String(max + 1).padStart(3, '0')}`;
}

const PREDEFINED_PAPERS = [
  // Kannada Newspapers
  'Prajavani', 'Vijaya Karnataka', 'Kannada Prabha', 'Udayavani', 'Samyukta Karnataka', 'Hosa Digantha',
  // English Newspapers
  'The Hindu', 'Times of India', 'Deccan Herald', 'Economic Times', 'Mint', 'Business Standard', 'Hindustan Times', 'Indian Express',
  // Hindi Newspapers
  'Dainik Bhaskar', 'Dainik Jagran', 'Amar Ujala',
  // Magazines (Kannada)
  'Sudha', 'Taranga', 'Roopatara', 'Kasturi', 'Mayura', 'Sanchike',
  // Magazines (English)
  'India Today', 'Frontline', 'The Week', 'Outlook', 'Business Today', 'Filmfare',
];

export default function AdminVendorsTab() {
  const [vendors, setVendors] = useState<VendorDoc[]>(store.getAllVendors());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string | null>(null);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorDoc | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [billDeadline, setBillDeadline] = useState<Date>(new Date());
  const [showBillDatePicker, setShowBillDatePicker] = useState(false);


  const [showBillModal, setShowBillModal] = useState(false);
  const [billMonth, setBillMonth] = useState('');
  const [billItems, setBillItems] = useState<{ id: string, name: string, amount: string }[]>([]);
  const [showPaperPicker, setShowPaperPicker] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [paperSearch, setPaperSearch] = useState('');
  const [markingBillId, setMarkingBillId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      const latest = store.getAllVendors();
      setVendors(latest);
      if (selectedVendor) {
        const refreshed = latest.find(v => v.id === selectedVendor.id);
        if (refreshed) setSelectedVendor(refreshed);
      }
    });
    return unsub;
  }, [selectedVendor]);

  const handleCreateVendor = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Please enter a vendor name.'); return; }
    if (!newLocation.trim()) { Alert.alert('Error', 'Please enter a location.'); return; }
    if (!newPhone.trim()) { Alert.alert('Error', 'Please enter a phone number.'); return; }
    if (newPhone.trim().length !== 10) { Alert.alert('Error', 'Phone number must be 10 digits.'); return; }
    
    // Check if phone number already exists
    const phoneExists = vendors.some(v => v.phone === newPhone.trim());
    if (phoneExists) {
      Alert.alert('Error', 'This phone number is already used by another vendor.');
      return;
    }
    
    const vendorId = generateCode(vendors); // VEND001, VEND002, etc.
    const secretCode = newPhone.trim().slice(-4); // Last 4 digits as secret code
    const vendorData: VendorDoc = {
      id: vendorId, name: newName.trim(), address: newLocation.trim(),
      phone: newPhone.trim(),
      secretCode, // Last 4 digits of phone
      paymentHistory: [], createdAt: new Date().toISOString(),
    };
    try {
      await saveVendor(vendorData);
      setNewName(''); setNewLocation(''); setNewPhone(''); setIsAddingVendor(false);
      Alert.alert('Vendor Created!', `Vendor ID: ${vendorId}\nSecret Code: ${secretCode} (Last 4 digits of phone)\n\nTap the vendor card to set payment amount and deadline.`);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };



  const handleApprove = (payment: VendorDoc['paymentHistory'][0]) => {
    if (!selectedVendor) return;
    Alert.alert('Approve Payment', `Approve Rs.${payment.amount}? Deadline will be pushed 1 month.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        const updatedHistory = selectedVendor.paymentHistory.map(p =>
          p.id === payment.id ? { ...p, status: 'Approved' as const } : p
        );
        const newDeadline = new Date(selectedVendor.deadline || new Date());
        newDeadline.setMonth(newDeadline.getMonth() + 1);
        await updateVendor(selectedVendor.id, { paymentHistory: updatedHistory, deadline: newDeadline.toISOString() });
      }}
    ]);
  };

  const handleReject = (payment: VendorDoc['paymentHistory'][0]) => {
    if (!selectedVendor) return;
    Alert.alert('Reject Payment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        const updatedHistory = selectedVendor.paymentHistory.map(p =>
          p.id === payment.id ? { ...p, status: 'Rejected' as const } : p
        );
        await updateVendor(selectedVendor.id, { paymentHistory: updatedHistory });
      }}
    ]);
  };

  const openVendor = (vendor: VendorDoc) => {
    setSelectedVendor(vendor);
  };

  const openBillModal = () => {
    setBillItems([{ id: Date.now().toString(), name: '', amount: '' }]);
    setBillMonth(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setBillDeadline(nextMonth);
    setShowBillModal(true);
  };

  const addBillItem = () => {
    setBillItems(prev => [...prev, { id: Date.now().toString(), name: '', amount: '' }]);
  };

  const removeBillItem = (id: string) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const updateBillItem = (id: string, field: 'name' | 'amount', value: string) => {
    setBillItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const openPaperPicker = (id: string) => {
    setPickerTargetId(id);
    setPaperSearch('');
    setShowPaperPicker(true);
  };

  const selectPaper = (paper: string) => {
    if (pickerTargetId) {
      updateBillItem(pickerTargetId, 'name', paper);
    } else {
      setBillItems(prev => [...prev, { id: Date.now().toString() + Math.random(), name: paper, amount: '' }]);
    }
    setShowPaperPicker(false);
    setPickerTargetId(null);
  };

  const handleToggleBillStatus = (bill: VendorBill) => {
    if (!selectedVendor) return;
    const isCurrentlyPaid = bill.status === 'Paid';
    const newStatus = isCurrentlyPaid ? 'Unpaid' : 'Paid';
    Alert.alert(
      isCurrentlyPaid ? 'Mark as Unpaid' : 'Mark as Paid',
      `Mark bill "${bill.month}" (Rs.${bill.totalAmount}) as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus,
          onPress: async () => {
            setMarkingBillId(bill.id);
            try {
              const updatedBills = (selectedVendor.bills || []).map(b =>
                b.id === bill.id ? { ...b, status: newStatus as 'Paid' | 'Unpaid', paidAt: newStatus === 'Paid' ? new Date().toISOString() : undefined } : b
              );
              await updateVendor(selectedVendor.id, { bills: updatedBills });
            } catch (e: any) { Alert.alert('Error', e.message); }
            finally { setMarkingBillId(null); }
          }
        },
      ]
    );
  };

  const handleGenerateBill = async () => {
    if (!selectedVendor) return;
    if (!billMonth.trim()) {
      Alert.alert('Error', 'Please enter a billing month.');
      return;
    }

    const validItems: VendorBillItem[] = [];
    let total = 0;
    for (const item of billItems) {
      const amt = parseFloat(item.amount);
      if (item.name.trim() && !isNaN(amt) && amt > 0) {
        validItems.push({ id: item.id, name: item.name.trim(), amount: amt });
        total += amt;
      }
    }

    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one valid item with a positive amount.');
      return;
    }

    const newBill: VendorBill = {
      id: `bill_${Date.now()}`,
      month: billMonth.trim(),
      date: new Date().toISOString(),
      deadline: billDeadline.toISOString(),
      items: validItems,
      totalAmount: total,
      status: 'Unpaid'
    };

    try {
      const updatedBills = [newBill, ...(selectedVendor.bills || [])];
      await updateVendor(selectedVendor.id, { bills: updatedBills });
      setShowBillModal(false);
      Alert.alert('Success', 'Detailed bill created successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteVendor = () => {
    if (!selectedVendor) return;
    Alert.alert(
      'Remove Vendor',
      `Are you sure you want to remove ${selectedVendor.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await deleteVendor(selectedVendor.id);
            setSelectedVendor(null);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      ]
    );
  };

  const uniqueLocations = Array.from(new Set(vendors.map(v => v.address?.trim()).filter(Boolean)));

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.secretCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.address && v.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = selectedLocationFilter ? v.address?.trim() === selectedLocationFilter : true;
    return matchesSearch && matchesLocation;
  });

  return (
    <View style={s.root}>
      {!selectedVendor ? (
        <>
          <View style={s.headerRow}>
            <Text style={s.title}>Vendors</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setIsAddingVendor(true)}>
              <PlusCircle size={18} color="#FFF" />
              <Text style={s.addBtnTxt}>Add Vendor</Text>
            </TouchableOpacity>
          </View>
          <View style={s.searchRow}>
            <Search size={16} color="#9CA3AF" />
            <TextInput 
              style={s.searchInp} 
              placeholder="Search by name, code, or location..." 
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {uniqueLocations.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginBottom: 12 }} contentContainerStyle={s.chipContent}>
              <TouchableOpacity 
                style={[s.chipBtn, selectedLocationFilter === null && { backgroundColor: '#2563EB', borderColor: '#2563EB' }]} 
                onPress={() => setSelectedLocationFilter(null)}
              >
                <Text style={[s.chipTxt, selectedLocationFilter === null && { color: '#FFF' }]}>All</Text>
              </TouchableOpacity>
              {uniqueLocations.map((loc, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[s.chipBtn, selectedLocationFilter === loc && { backgroundColor: '#2563EB', borderColor: '#2563EB' }]} 
                  onPress={() => setSelectedLocationFilter(loc as string)}
                >
                  <Text style={[s.chipTxt, selectedLocationFilter === loc && { color: '#FFF' }]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {filteredVendors.length === 0 ? (
            <Text style={s.emptyTxt}>{vendors.length === 0 ? 'No vendors yet. Tap "Add Vendor" to create one.' : 'No vendors found.'}</Text>
          ) : (
            filteredVendors.map(vendor => {
              const pendingCount = (vendor.paymentHistory || []).filter(p => p.status === 'Pending').length;
              return (
                <TouchableOpacity key={vendor.id} style={s.vendorRow} activeOpacity={0.8} onPress={() => openVendor(vendor)}>
                  <View style={s.vendorAvatar}>
                    <Text style={s.vendorAvatarTxt}>{vendor.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.vendorRowName}>{vendor.name}</Text>
                    <Text style={s.vendorRowCode}>Vendor ID: {vendor.id}</Text>
                    <Text style={s.vendorRowCode}>Secret Code: {vendor.secretCode}</Text>
                    {vendor.address ? <Text style={s.vendorRowLoc}>{vendor.address}</Text> : null}
                    {vendor.phone ? <Text style={s.vendorRowLoc}>{vendor.phone}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {pendingCount > 0 && <View style={s.pendingBadge}><Text style={s.pendingBadgeTxt}>{pendingCount} Pending</Text></View>}
                    {vendor.paymentAmount
                      ? <Text style={s.vendorRowAmount}>Rs.{vendor.paymentAmount}</Text>
                      : <Text style={s.vendorRowAmountMissing}>Set amount</Text>}
                    {vendor.phone && (
                      <TouchableOpacity style={s.callBtnSmall} onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`tel:${vendor.phone}`); }}>
                        <Phone size={12} color="#2563EB" />
                        <Text style={s.callBtnSmallTxt}>Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })
          )}
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={[s.headerRow, { marginBottom: 20 }]}>
            <TouchableOpacity onPress={() => setSelectedVendor(null)} style={s.backBtn}>
              <ChevronRight size={20} color="#374151" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.title}>{selectedVendor.name}</Text>
              <Text style={s.detailCode}>Vendor ID: {selectedVendor.id}</Text>
              <Text style={s.detailCode}>Secret Code: {selectedVendor.secretCode}</Text>
            </View>
            <TouchableOpacity onPress={handleDeleteVendor} style={[s.backBtn, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {selectedVendor.address ? (
            <View style={s.infoRow}><MapPin size={14} color="#9CA3AF" /><Text style={s.infoTxt}>{selectedVendor.address}</Text></View>
          ) : null}
          {selectedVendor.phone ? (
            <View style={s.infoRow}>
              <Phone size={14} color="#9CA3AF" />
              <Text style={s.infoTxt}>{selectedVendor.phone}</Text>
              <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${selectedVendor.phone}`)}>
                <Phone size={13} color="#FFF" />
                <Text style={s.callBtnTxt}>Call Vendor</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={s.detailCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.detailCardTitle}>Vendor Bills</Text>
              <TouchableOpacity style={s.addBillBtn} onPress={openBillModal}>
                <PlusCircle size={14} color="#FFF" />
                <Text style={s.addBillBtnTxt}>New Bill</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const unpaidBills = (selectedVendor.bills || []).filter(b => b.status !== 'Paid');
              if (unpaidBills.length === 0) {
                return <Text style={s.emptyTxt}>No active/unpaid bills.</Text>;
              }
              return unpaidBills.map((bill, index) => (
                <View key={bill.id} style={[s.paymentRow, index > 0 && { marginTop: 10 }]}>
                  <View style={[s.paymentDot, bill.status === 'Paid' ? { backgroundColor: '#10B981' } : bill.status === 'Unpaid' ? { backgroundColor: '#EF4444' } : { backgroundColor: '#F59E0B' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.paymentAmount}>Rs.{bill.totalAmount} <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>({bill.month})</Text></Text>
                    <Text style={s.paymentDate}>{bill.items.length} item{bill.items.length !== 1 ? 's' : ''}</Text>
                    {bill.deadline ? (
                      <Text style={s.paymentDate}>Due: {new Date(bill.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    ) : null}
                    <Text style={[s.paymentStatus, bill.status === 'Paid' ? s.cGreen : bill.status === 'Unpaid' ? s.cRed : s.cOrange]}>
                      {bill.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={bill.status === 'Paid' ? s.paidBadge : s.markPaidBtn}
                    onPress={() => handleToggleBillStatus(bill)}
                    disabled={markingBillId === bill.id}
                  >
                    {markingBillId === bill.id
                      ? <Text style={bill.status === 'Paid' ? s.paidBadgeTxt : s.markPaidTxt}>...</Text>
                      : bill.status === 'Paid'
                        ? <><CheckCircle size={14} color="#065F46" /><Text style={s.paidBadgeTxt}>Paid</Text></>
                        : <><CheckCircle size={14} color="#FFF" /><Text style={s.markPaidTxt}>Mark Paid</Text></>
                    }
                  </TouchableOpacity>
                </View>
              ));
            })()}
          </View>



          <Text style={s.sectionTitle}>Payment History</Text>
          {(() => {
            const paidBills = (selectedVendor.bills || []).filter(b => b.status === 'Paid').map(b => ({
              id: b.id,
              amount: b.totalAmount,
              date: b.paidAt || b.date,
              status: 'Approved',
              screenshot: b.paymentProof,
              isBill: true,
              title: `Bill: ${b.month}`
            }));
            const legacyPayments = (selectedVendor.paymentHistory || []).map(p => ({
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

            return combinedHistory.map(payment => {
              const d = payment.date ? new Date(payment.date) : null;
              const validDate = d && !isNaN(d.getTime());
              const isApproved = payment.status === 'Approved';
              const isRejected = payment.status === 'Rejected';
              return (
                <View key={payment.id} style={s.paymentRow}>
                  <View style={[s.paymentDot, isApproved ? { backgroundColor: '#10B981' } : isRejected ? { backgroundColor: '#EF4444' } : { backgroundColor: '#F59E0B' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.paymentAmount, { fontSize: 13 }]}>{payment.title}</Text>
                    <Text style={s.paymentAmount}>Rs.{payment.amount}</Text>
                    <Text style={s.paymentDate}>{validDate ? d!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date'}</Text>
                    <Text style={[s.paymentStatus, isApproved ? s.cGreen : isRejected ? s.cRed : s.cOrange]}>
                      {payment.isBill ? 'Paid' : (isApproved ? 'Clear' : isRejected ? 'Rejected' : 'Pending approval')}
                    </Text>
                  </View>
                  <View style={{ gap: 8, alignItems: 'flex-end' }}>
                    {payment.screenshot ? (
                      <TouchableOpacity style={s.viewProofBtn} onPress={() => setSelectedScreenshot(payment.screenshot || null)}>
                        <FileText size={14} color="#2563EB" /><Text style={s.viewProofTxt}>Proof</Text>
                      </TouchableOpacity>
                    ) : null}
                    {!payment.isBill && payment.status === 'Pending' && (
                      <View style={s.actionRow}>
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleApprove(payment as any)}>
                          <CheckCircle size={16} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleReject(payment as any)}>
                          <X size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            });
          })()}
        </ScrollView>
      )}

      <Modal visible={isAddingVendor} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>New Vendor</Text>
              <TouchableOpacity onPress={() => { setIsAddingVendor(false); setNewName(''); setNewLocation(''); setNewPhone(''); }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Vendor Name *</Text>
            <TextInput style={s.inp} value={newName} onChangeText={setNewName} placeholder="e.g. Masen Agencies" placeholderTextColor="#9CA3AF" autoFocus />
            <Text style={s.lbl}>Location *</Text>
            <TextInput style={s.inp} value={newLocation} onChangeText={setNewLocation} placeholder="e.g. Chennai, Anna Nagar" placeholderTextColor="#9CA3AF" />
            <Text style={s.lbl}>Phone Number *</Text>
            <TextInput style={s.inp} value={newPhone} onChangeText={(text) => {
              const numericText = text.replace(/[^0-9]/g, '');
              setNewPhone(numericText);
            }} placeholder="e.g. 9876543210" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} />
            {uniqueLocations.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipContent}>
                {uniqueLocations.map((loc, idx) => (
                  <TouchableOpacity key={idx} style={s.chipBtn} onPress={() => setNewLocation(loc as string)}>
                    <Text style={s.chipTxt}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={s.saveBtn} onPress={handleCreateVendor}>
              <Text style={s.saveBtnTxt}>Create Vendor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBillModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.sheet, { height: '85%' }]}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Generate Bill</Text>
              <TouchableOpacity onPress={() => setShowBillModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Billing Month</Text>
            <TextInput style={s.inp} value={billMonth} onChangeText={setBillMonth} placeholder="e.g. August 2026" placeholderTextColor="#9CA3AF" />
            <Text style={s.lbl}>Payment Deadline</Text>
            <TouchableOpacity style={[s.datePickerBtn, { marginBottom: 12 }]} onPress={() => setShowBillDatePicker(true)}>
              <Clock size={16} color="#6B7280" />
              <Text style={s.datePickerTxt}>{billDeadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </TouchableOpacity>
            {showBillDatePicker && (
              <DateTimePicker
                value={billDeadline}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_, date) => { setShowBillDatePicker(Platform.OS === 'ios'); if (date) setBillDeadline(date); }}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
              <Text style={[s.lbl, { marginBottom: 0 }]}>Line Items</Text>
              <TouchableOpacity onPress={() => { setPickerTargetId(null); setPaperSearch(''); setShowPaperPicker(true); }}>
                <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '700' }}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 16 }}>
              {billItems.map((item, index) => (
                <View key={item.id} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[s.inp, { flex: 2, marginBottom: 0, justifyContent: 'center' }]}
                    onPress={() => openPaperPicker(item.id)}
                  >
                    <Text style={{ color: item.name ? '#111827' : '#9CA3AF', fontSize: 14 }}>
                      {item.name || 'Tap to select paper/magazine'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[s.inp, { flex: 1, marginBottom: 0 }]}
                    value={item.amount}
                    onChangeText={(val) => updateBillItem(item.id, 'amount', val)}
                    placeholder="Amt (Rs)"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => removeBillItem(item.id)} style={{ padding: 6 }}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={s.saveBtn} onPress={handleGenerateBill}>
              <Text style={s.saveBtnTxt}>Generate Detailed Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedScreenshot} transparent>
        <View style={s.fsOverlay}>
          <TouchableOpacity style={s.fsClose} onPress={() => setSelectedScreenshot(null)}>
            <X size={30} color="#FFF" />
          </TouchableOpacity>
          {selectedScreenshot && <Image source={{ uri: selectedScreenshot }} style={s.fsImage} resizeMode="contain" />}
        </View>
      </Modal>

      {/* Paper Picker Modal */}
      <Modal visible={showPaperPicker} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.sheet, { height: '75%' }]}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select Newspaper / Magazine</Text>
              <TouchableOpacity onPress={() => setShowPaperPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={[s.searchRow, { marginBottom: 12 }]}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                style={s.searchInp}
                placeholder="Search papers & magazines..."
                placeholderTextColor="#9CA3AF"
                value={paperSearch}
                onChangeText={setPaperSearch}
                autoFocus
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PREDEFINED_PAPERS.filter(p => p.toLowerCase().includes(paperSearch.toLowerCase())).map(paper => (
                <TouchableOpacity key={paper} style={s.pickerRow} onPress={() => selectPaper(paper)}>
                  <Text style={s.pickerRowTxt}>{paper}</Text>
                </TouchableOpacity>
              ))}
              {paperSearch.trim() && !PREDEFINED_PAPERS.some(p => p.toLowerCase() === paperSearch.toLowerCase()) && (
                <TouchableOpacity style={[s.pickerRow, { backgroundColor: '#EFF6FF' }]} onPress={() => selectPaper(paperSearch.trim())}>
                  <Text style={[s.pickerRowTxt, { color: '#2563EB' }]}>+ Add "{paperSearch.trim()}" as custom item</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  addBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { textAlign: 'center', color: '#9CA3AF', marginTop: 30, fontStyle: 'italic', fontSize: 13 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  vendorAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  vendorAvatarTxt: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  vendorRowName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  vendorRowCode: { fontSize: 12, color: '#2563EB', fontWeight: '700', marginTop: 2 },
  vendorRowLoc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  vendorRowAmount: { fontSize: 13, fontWeight: '800', color: '#059669' },
  vendorRowAmountMissing: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' },
  pendingBadgeTxt: { fontSize: 10, color: '#B45309', fontWeight: '700' },
  detailCode: { fontSize: 12, color: '#2563EB', fontWeight: '800', marginTop: 2 },
  detailCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  detailCardTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  infoTxt: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 10, marginTop: 4 },
  addBillBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  addBillBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  paymentRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  paymentDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  paymentAmount: { fontSize: 14, fontWeight: '800', color: '#111827' },
  paymentDate: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  paymentStatus: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  cGreen: { color: '#10B981' }, cRed: { color: '#EF4444' }, cOrange: { color: '#F59E0B' },
  viewProofBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  viewProofTxt: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  actionRow: { flexDirection: 'row', gap: 6 },
  actionBtn: { padding: 6, borderRadius: 6 },
  lbl: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inp: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13, marginBottom: 12, backgroundColor: '#FAFAFA', color: '#111827' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 12, backgroundColor: '#FAFAFA' },
  datePickerTxt: { fontSize: 13, color: '#111827', fontWeight: '500' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 8, height: 40, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  saveBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pickerRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  pickerRowTxt: { fontSize: 15, color: '#111827', fontWeight: '500' },
  fsOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fsClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fsImage: { width: '100%', height: '80%' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 12, marginBottom: 4 },
  searchInp: { flex: 1, fontSize: 13, marginLeft: 8, color: '#111827' },
  chipScroll: { maxHeight: 40, marginBottom: 16 },
  chipContent: { gap: 8, paddingVertical: 2 },
  chipBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center' },
  chipTxt: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5, marginLeft: 8 },
  callBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  callBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 3, borderWidth: 1, borderColor: '#BFDBFE' },
  callBtnSmallTxt: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  markPaidBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5, alignSelf: 'flex-start' },
  markPaidTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5, borderWidth: 1, borderColor: '#6EE7B7' },
  paidBadgeTxt: { color: '#065F46', fontSize: 12, fontWeight: '700' },
});
