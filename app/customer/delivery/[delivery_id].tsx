import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Linking, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Phone, CheckCircle, Package, Clock, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { store, Delivery } from '../../../utils/store';

export default function DeliveryDetailScreen() {
  const { delivery_id } = useLocalSearchParams<{ delivery_id: string }>();
  const [delivery, setDelivery] = useState<Delivery | undefined>();

  useEffect(() => {
    const fetchDelivery = () => {
      const d = store.getDeliveries().find(item => item.id === delivery_id);
      setDelivery(d);
    };
    
    fetchDelivery();
    const unsubscribe = store.subscribe(fetchDelivery);
    return unsubscribe;
  }, [delivery_id]);

  if (!delivery) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#64748B' }}>Loading details...</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    if (delivery.phone) {
      Linking.openURL(`tel:${delivery.phone}`);
    } else {
      alert('No phone number available for this customer.');
    }
  };

  const handleMarkDelivered = () => {
    // Delivery status marking removed - no longer needed
    alert('This feature has been removed');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Customer Info Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{delivery.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.custName}>{delivery.name}</Text>
              {delivery.phone && (
                <Text style={styles.custPhone}>{delivery.phone}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, delivery.status === 'Delivered' && styles.statusBadgeSuccess]}>
              <Text style={[styles.statusText, delivery.status === 'Delivered' && styles.statusTextSuccess]}>
                {delivery.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.addressText}>{delivery.address}</Text>
          </View>
        </View>

        {/* Subscription Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription Summary</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
            <Image source={delivery.src} style={{ width: 50, height: 50 }} resizeMode="contain" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{delivery.paperName}</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{delivery.plan || 'Daily'} Plan</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                ₹{delivery.plan === 'Monthly' ? delivery.priceMonth : delivery.priceDay}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>
                {delivery.plan === 'Monthly' ? '/ month' : '/ day'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Calendar size={16} color="#2563EB" />
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{delivery.startDate || 'N/A'}</Text>
            </View>
            

            
            <View style={[styles.detailBox, { width: '100%' }]}>
              <Package size={16} color="#2563EB" />
              <Text style={styles.detailLabel}>Delivery Days</Text>
              <Text style={styles.detailValue}>{delivery.days?.join(', ') || 'Mon-Sat'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Fee (₹50)</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '500' }}>Paid Via</Text>
            <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: '700' }}>{delivery.paymentMethod || 'UPI'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '500' }}>Status</Text>
            <Text style={{ fontSize: 14, color: '#16A34A', fontWeight: '700' }}>Received</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 12, fontStyle: 'italic', lineHeight: 16 }}>
            * Note: Monthly subscription cost is collected by the vendor directly.
          </Text>
        </View>
        
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.callBtn} activeOpacity={0.8} onPress={handleCall}>
          <Phone size={18} color="#0F172A" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.deliverBtn, delivery.status === 'Delivered' && { backgroundColor: '#F1F5F9' }]} 
          activeOpacity={0.8} 
          onPress={handleMarkDelivered}
          disabled={delivery.status === 'Delivered'}
        >
          {delivery.status === 'Delivered' ? (
            <>
              <CheckCircle size={18} color="#64748B" />
              <Text style={[styles.deliverBtnText, { color: '#64748B' }]}>Delivered</Text>
            </>
          ) : (
            <>
              <Package size={18} color="#FFFFFF" />
              <Text style={styles.deliverBtnText}>Mark Delivered</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  custName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  custPhone: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statusBadge: {
    backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusBadgeSuccess: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  statusTextSuccess: { color: '#16A34A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  addressText: { fontSize: 13, color: '#475569', marginLeft: 8, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  detailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12,
  },
  detailBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F1F5F9', width: '48%',
  },
  detailLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 6 },
  detailValue: { fontSize: 13, color: '#0F172A', fontWeight: '700', marginTop: 2 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F8FAFC', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0', flex: 0.4,
  },
  callBtnText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  deliverBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, flex: 1,
  },
  deliverBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
