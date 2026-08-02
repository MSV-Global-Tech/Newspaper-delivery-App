import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, X, Calendar, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { store } from '../../../utils/store';

export default function OrdersScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
    });
    return unsubscribe;
  }, []);

  const myOrders = deliveries.filter(d => d.name === user?.name);

  const statusColor = (status: string) => {
    if (status === 'Delivered' || status === 'Pending') return { bg: '#ECFDF5', text: '#16A34A' };
    if (status === 'Skipped') return { bg: '#FEF2F2', text: '#EF4444' };
    return { bg: '#FFF7ED', text: '#D97706' };
  };

  const statusIcon = (status: string) => {
    if (status === 'Delivered' || status === 'Pending') return <CheckCircle size={14} color="#16A34A" />;
    if (status === 'Skipped') return <AlertCircle size={14} color="#EF4444" />;
    return <Clock size={14} color="#D97706" />;
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
            <ArrowLeft size={18} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>My Orders</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Package size={52} color="#CBD5E1" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 16, textAlign: 'center' }}>Please log in to view your orders</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14, marginTop: 20 }}
            onPress={() => router.push('/customer/login')}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>My Orders</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{myOrders.length} order{myOrders.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {myOrders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Package size={56} color="#CBD5E1" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 16 }}>No orders yet</Text>
            <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center' }}>Subscribe to a newspaper to see your orders here</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, marginTop: 24 }}
              onPress={() => router.push('/customer/newspapers')}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Browse Papers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myOrders.map(order => {
            const isExpanded = expandedId === order.id;
            const sc = statusColor(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                onPress={() => setExpandedId(isExpanded ? null : order.id)}
                activeOpacity={0.8}
              >
                {/* Compact header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                  {/* Paper image */}
                  {order.src ? (
                    <View style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                      <Image source={order.src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#2563EB' }}>{order.paperName?.substring(0, 3).toUpperCase()}</Text>
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{order.paperName}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 }}>{order.plan || 'Monthly'} · ₹{order.priceMonth}/mo</Text>
                    {order.startDate && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Calendar size={10} color="#94A3B8" />
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>Started {order.startDate}</Text>
                      </View>
                    )}
                  </View>

                  {/* Status + chevron */}
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      {statusIcon(order.status)}
                      <Text style={{ fontSize: 11, fontWeight: '700', color: sc.text }}>{order.status === 'Pending' ? 'Active' : order.status}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>{isExpanded ? '▲ less' : '▼ more'}</Text>
                  </View>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10 }}>
                    {/* Detail rows */}
                    {[
                      { label: 'Address', value: order.address },
                      { label: 'Delivery Days', value: order.days?.map(d => d.slice(0, 3)).join(', ') || '—' },
                      { label: 'Order Fee', value: order.paymentMethod ? `₹50 paid via ${order.paymentMethod}` : '—' },
                      { label: 'Category', value: order.category || 'Newspaper' },
                    ].map(row => (
                      <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>{row.label}</Text>
                        <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 }}>{row.value}</Text>
                      </View>
                    ))}

                    {/* Home Location Photo */}
                    {order.homeImageUri && (
                      <View style={{ marginTop: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <MapPin size={13} color="#2563EB" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', marginLeft: 5 }}>Home Location Photo</Text>
                        </View>
                        <TouchableOpacity onPress={() => setFullImageUri(order.homeImageUri!)} activeOpacity={0.9}>
                          <Image
                            source={{ uri: order.homeImageUri }}
                            style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: '#F1F5F9' }}
                            resizeMode="cover"
                          />
                          <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>Tap to view full</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Full Screen Image Viewer */}
      <Modal visible={fullImageUri !== null} animationType="fade" transparent={true} onRequestClose={() => setFullImageUri(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }}
            onPress={() => setFullImageUri(null)}
          >
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {fullImageUri && (
            <Image source={{ uri: fullImageUri }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
