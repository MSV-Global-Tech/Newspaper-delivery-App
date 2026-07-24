import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import {
  Bell,
  MapPin,
  ChevronDown,
  CheckCircle2,
  Star,
  ChevronRight,
  Calendar,
  PauseCircle,
  SkipForward,
  CreditCard,
  Phone,
} from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { IMAGES } from '../../assets/images';
import { store } from '../../utils/store';



const QUICK_ACTIONS: any[] = [
  { id: 'skip', label: 'Skip\nTomorrow', icon: SkipForward, bg: '#EEF2FF', color: '#2563EB' },
  { id: 'pause', label: 'Pause', icon: PauseCircle, bg: '#FFF7ED', color: '#EA580C' },
  { id: 'call', label: 'Call Agent', subtitle: 'Akhil K S', icon: FontAwesome, iconName: 'phone', bg: '#EEF2FF', color: '#2563EB' },
  { 
    id: 'whatsapp', 
    label: 'WhatsApp', 
    isImage: true, 
    imageSrc: { uri: 'https://raw.githubusercontent.com/WalkxCode/dashboard-icons/main/png/whatsapp.png' }, 
    bg: '#E8FBF0', 
    color: '#25D366' 
  },
];

const HOURS = new Date().getHours();
const GREETING = HOURS < 12 ? 'Good Morning' : HOURS < 17 ? 'Good Afternoon' : 'Good Evening';
const CARD_WIDTH = Dimensions.get('window').width - 32;

export default function HomeScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [papers, setPapers] = useState(store.getPapers());

  const contactAgent = () => {
    Linking.openURL('tel:9972505709');
  };

  const whatsappAgent = () => {
    Linking.openURL('https://api.whatsapp.com/send?phone=919972505709');
  };

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
      setPapers(store.getPapers());
    });
    return unsubscribe;
  }, []);

  const customerDeliveries = deliveries.filter((d) => d.name === user?.name);
  const currentDelivery = customerDeliveries[0] || null;

  const scrollRef = useRef<ScrollView>(null);
  const adIndexRef = useRef(0);

  useEffect(() => {
    if (currentDelivery || papers.length === 0) return;

    const interval = setInterval(() => {
      adIndexRef.current = (adIndexRef.current + 1) % papers.length;
      scrollRef.current?.scrollTo({
        x: adIndexRef.current * CARD_WIDTH,
        animated: true,
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [currentDelivery, papers.length]);

  const handleQuickAction = (action: any) => {
    if (action.id === 'call') {
      contactAgent();
      return;
    }
    if (action.id === 'whatsapp') {
      whatsappAgent();
      return;
    }

    if (action.route) {
      router.push(action.route);
      return;
    }

    if (!user && (action.id === 'skip' || action.id === 'pause')) {
      router.push('/login');
      return;
    }

    if (!currentDelivery && (action.id === 'skip' || action.id === 'pause')) {
      Alert.alert('No Subscription', 'You don\'t have any active deliveries to skip or pause.');
      return;
    }

    if (action.id === 'skip' || action.id === 'pause') {
      router.push('/manage-subscription');
    }
  };

  const requireAuth = (callback: () => void) => {
    if (!user) {
      router.push('/login');
    } else {
      callback();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" animated={true} />

      {/* ── CLEAN WHITE TOP HEADER ──────────────── */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>
            Hello, <Text style={styles.greetingName}>{user?.name || 'Customer'}</Text> 👋
          </Text>
          <Text style={styles.mainTitle}>{GREETING}!</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Bell size={20} color="#0F172A" />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>

      {/* Location row */}
      <View style={styles.locationRow}>
        <MapPin size={14} color="#2563EB" />
        <Text style={styles.locationText} numberOfLines={1}>
          {user?.address || 'Set your delivery location'}
        </Text>
        <ChevronDown size={13} color="#2563EB" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      >
        <View style={styles.body}>

          {/* ── TODAY'S DELIVERY CARD ─────────────────────────── */}
          {currentDelivery?.status === 'Skipped' ? (
            <View style={[styles.todayCard, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
              <PauseCircle size={32} color="#94A3B8" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 12 }}>Delivery Paused</Text>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>You have skipped today's delivery.</Text>
              <TouchableOpacity 
                style={{ marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                onPress={() => store.updateDeliveryStatus(currentDelivery.id, 'Pending')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Resume Delivery</Text>
              </TouchableOpacity>
            </View>
          ) : currentDelivery ? (
            <View style={styles.todayCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.todaySub}>Today's Delivery</Text>
                <Text style={styles.todayTitle}>
                  {currentDelivery.paperName}
                </Text>
                <Text style={styles.todayTime}>
                  Delivery by {currentDelivery.time || '5:30 AM'}
                </Text>
                <View style={styles.confirmedBadge}>
                  <CheckCircle2 size={12} color="#fff" />
                  <Text style={styles.confirmedText}>
                    {currentDelivery.status === 'Delivered' ? 'Delivered' : 'Confirmed'}
                  </Text>
                </View>
              </View>
              {/* Logo sits on white mini card */}
              <View style={styles.todayLogoCard}>
                <Image
                  source={currentDelivery.src}
                  style={{ width: 86, height: 86 }}
                  resizeMode="contain"
                />
              </View>
            </View>
          ) : (
            <View style={[styles.todayCard, { paddingVertical: 24, paddingHorizontal: 0, overflow: 'hidden', minHeight: 180 }]}>
              <ScrollView 
                ref={scrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
              >
                {papers.map((paper, index) => (
                  <TouchableOpacity 
                    key={index}
                    activeOpacity={0.9}
                    onPress={() => requireAuth(() => router.push(`/newspaper/${paper.id}` as any))}
                    style={{
                      width: CARD_WIDTH,
                      paddingHorizontal: 24,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 16 }}>
                      <Text style={{ color: '#93C5FD', fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 }}>
                        FEATURED PAPER
                      </Text>
                      <Text style={styles.todayTitle} numberOfLines={1}>
                        {paper.name}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                          ₹{paper.priceMonth}/mo
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Star size={12} color="#FBBF24" fill="#FBBF24" />
                          <Text style={{ color: '#FBBF24', fontSize: 13, fontWeight: '700' }}>
                            {paper.rating}
                          </Text>
                        </View>
                      </View>

                      <Text style={{ color: '#E0E7FF', fontSize: 13, marginTop: 12, lineHeight: 18 }}>
                        Stay informed daily with the best {paper.language} newspaper, delivered right to your door.
                      </Text>
                    </View>
                    <View style={[styles.todayLogoCard, { padding: 12, borderRadius: 16 }]}>
                      <Image source={paper.src} style={{ width: 72, height: 72 }} resizeMode="contain" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── QUICK ACTIONS ─────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.quickCard}
                activeOpacity={0.7}
                onPress={() => handleQuickAction(a)}
              >
                <View style={[styles.quickIconBox, { backgroundColor: a.bg }]}>
                  {a.isImage ? (
                    <Image source={a.imageSrc} style={{ width: 28, height: 28 }} resizeMode="contain" />
                  ) : a.iconName ? (
                    <a.icon name={a.iconName} size={21} color={a.color} />
                  ) : (
                    <a.icon size={21} color={a.color} />
                  )}
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
                {a.subtitle && (
                  <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '600', marginTop: 2, textAlign: 'center' }}>
                    {a.subtitle}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ACTIVE SUBSCRIPTION ───────────────────────────── */}
          {user && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Subscription</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')}>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {customerDeliveries.length > 0 ? (
                customerDeliveries.map((delivery, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activeCard}
                    onPress={() => router.push('/manage-subscription')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.logoWrapper}>
                      <Image source={delivery.src} style={{ width: 64, height: 64 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.activeName}>{delivery.paperName}</Text>
                      <Text style={styles.activeMeta}>₹{delivery.priceMonth}/mo  •  {delivery.plan || 'Monthly'}</Text>
                      <Text style={styles.activeNext}>Next Delivery: Tomorrow</Text>
                    </View>
                    <View>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>
                          {delivery.status === 'Delivered' ? 'Delivered' : 'Active'}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#CBD5E1" style={{ marginTop: 10, alignSelf: 'flex-end' }} />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#64748B', marginBottom: 20 }}>No active subscriptions yet.</Text>
              )}
            </>
          )}

          {/* ── POPULAR NEWSPAPERS ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Newspapers</Text>
            <TouchableOpacity onPress={() => router.push('/newspapers')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {papers.map((paper) => (
            <TouchableOpacity
              key={paper.id}
              style={styles.paperCard}
              activeOpacity={0.85}
              onPress={() => requireAuth(() => router.push(`/newspaper/${paper.id}` as any))}
            >
              {/* Logo area — grey tinted background strip */}
              <View style={styles.paperLogoArea}>
                <Image source={paper.src} style={{ width: 64, height: 64 }} resizeMode="contain" />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.paperName}>{paper.name}</Text>
                <Text style={styles.paperLang}>{paper.language}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{paper.rating}</Text>
                </View>
                <Text style={styles.paperPrice}>₹{paper.priceDay}/day  •  ₹{paper.priceMonth}/mo</Text>
              </View>

              <TouchableOpacity
                style={styles.subBtn}
                onPress={() => requireAuth(() => router.push(`/subscribe/${paper.id}` as any))}
                activeOpacity={0.85}
              >
                <Text style={styles.subBtnText}>Subscribe</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
  },
  greetingText: { fontSize: 14, color: '#334155', fontWeight: '700', letterSpacing: -0.2 },
  greetingName: { color: '#2563EB', fontWeight: '900' },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginTop: 2, letterSpacing: -0.4 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationText: { fontSize: 13, fontWeight: '700', color: '#2563EB', flex: 1 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  badgeDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2563EB', borderWidth: 1.5, borderColor: '#FFFFFF',
  },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  todayCard: {
    backgroundColor: '#2563EB', borderRadius: 20, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 5,
  },
  todaySub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  todayTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 2 },
  todayTime: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4, fontWeight: '500' },
  confirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, alignSelf: 'flex-start', marginTop: 10,
  },
  confirmedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  todayLogoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickCard: {
    width: '23%', backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  quickIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  viewAll: { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  activeCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  logoWrapper: {
    width: 76, height: 76,
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 6,
    borderWidth: 1, borderColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  activeName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  activeMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  activeNext: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  activeBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-end',
  },
  activeBadgeText: { color: '#15803D', fontSize: 10, fontWeight: '800' },

  paperCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  paperLogoArea: {
    width: 76, height: 76, backgroundColor: '#F8FAFC',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  paperName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  paperLang: { fontSize: 12, color: '#64748B', marginTop: 1 },
  paperPrice: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '500' },
  subBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 13,
    paddingVertical: 8, borderRadius: 10, marginLeft: 8,
  },
  subBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
