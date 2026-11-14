import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { Calendar, CreditCard, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { store } from '../../../utils/store';

const ACTIONS = [
  { label: 'Calendar', icon: Calendar },
  { label: 'Payments', icon: CreditCard },
];

export default function SubscriptionsScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());

  // Language display mapping (Kannada/English)
  const getLanguageDisplay = (lang: string) => {
    const langMap: Record<string, string> = {
      'Kannada': 'ಕನ್ನಡ/Kannada',
      'English': 'English',
      'Hindi': 'हिंदी/Hindi',
      'Tamil': 'தமிழ்/Tamil',
      'Telugu': 'తెలుగు/Telugu',
      'Malayalam': 'മലയാളം/Malayalam',
    };
    return langMap[lang] || lang;
  };

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
    });
    return unsubscribe;
  }, []);

  const activeSubs = deliveries
    .filter((d) => d.name === user?.name && d.plan !== 'One-time')
    .map((d) => {
      const isNewspaper = d.category === 'Newspaper' || !d.category;

      let logo_text = '';
      let logo_bg = '#EFF6FF';
      let logo_color = '#2563EB';
      let language = d.paperName === 'The Hindu' ? 'English' : 'Kannada';
      let category = 'Newspaper';

      if (isNewspaper) {
        logo_text = d.paperName.substring(0, 3).toUpperCase();
      }

      return {
        id: d.id,
        name: d.paperName,
        language,
        category,
        status: d.status || 'Active',
        nextDelivery: 'Tomorrow',
        plan: d.plan || 'Monthly',
        price: d.priceMonth || 180,
        logo_text,
        logo_bg,
        logo_color,
      };
    });

  const handleAction = (sub: any, action: string) => {
    if (action === 'Calendar') {
      router.push('/customer/bottom_nav/calendar');
    } else if (action === 'Payments') {
      router.push('/customer/bottom_nav/bills');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
            <ArrowLeft size={18} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#111827', fontSize: 20, fontWeight: '800' }}>My Subscriptions</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 1 }}>Manage your newspaper deliveries</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 24 }}>
            Please log in or sign up to view and manage your subscriptions.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563EB', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center' }}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#111827', fontSize: 20, fontWeight: '800' }}>My Subscriptions</Text>
          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 1 }}>Manage your newspaper deliveries</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {activeSubs.length > 0 ? (
            activeSubs.map((sub) => (
              <View
                key={sub.id}
                style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16, overflow: 'hidden' }}
              >
                {/* Paper header */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 52, height: 52, backgroundColor: sub.logo_bg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '700', color: sub.logo_color, fontSize: 14 }}>{sub.logo_text}</Text>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#111827', fontSize: 15 }}>{sub.name}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>{getLanguageDisplay(sub.language)} | {sub.category}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Plan: {sub.plan}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '700' }}>{sub.status}</Text>
                  </View>
                </View>

                {/* Quick Action Row */}
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                  {ACTIONS.map((action, i) => (
                    <TouchableOpacity
                      key={action.label}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderRightWidth: i < ACTIONS.length - 1 ? 1 : 0,
                        borderRightColor: '#F3F4F6',
                        backgroundColor: '#FFFFFF',
                      }}
                      activeOpacity={0.6}
                      onPress={() => handleAction(sub, action.label)}
                    >
                      <action.icon size={18} color="#2563EB" />
                      <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 4, fontWeight: '500' }}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 }}>
              <Text style={{ color: '#6B7280', fontWeight: '700', fontSize: 14 }}>No subscriptions found</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Subscribe to a newspaper to see it here</Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
