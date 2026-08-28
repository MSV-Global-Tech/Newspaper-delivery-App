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
  Modal,
  Animated,
  Share,
} from 'react-native';
import {
  Bell,
  MapPin,
  ChevronDown,
  CheckCircle2,
  ChevronRight,
  PauseCircle,
  SkipForward,
} from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { store } from '../../../utils/store';
import { checkForUpdate, type RemoteVersionInfo } from '../../../utils/updateChecker';



const QUICK_ACTIONS: any[] = [
  { id: 'skip', label: 'Skip\nTomorrow', icon: SkipForward, bg: '#EEF2FF', color: '#2563EB' },
  { id: 'pause', label: 'Pause', icon: PauseCircle, bg: '#FFF7ED', color: '#EA580C' },
  { id: 'call', label: 'Call Agent', subtitle: 'Customer care', icon: FontAwesome, iconName: 'phone', bg: '#EEF2FF', color: '#2563EB' },
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
const WINDOW_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = WINDOW_WIDTH - 32;          // card outer width
const CAROUSEL_ITEM_W = CARD_WIDTH;            // item = full card width, padding inside item
const LANG_GAP = 10;
const LANG_TILE_W = Math.floor((CARD_WIDTH - LANG_GAP * 2) / 3);
const HOW_CARD_W = Math.floor(CARD_WIDTH * 0.78);

// ── App feature slides shown in the home banner carousel ──────────────────
const APP_FEATURES = [
  {
    id: '1',
    tag: 'Our Service',
    title: 'Daily Paper,\nDelivered to Your Door',
    desc: 'Subscribe once. We deliver every morning, rain or shine.',
    image: require('../../../assets/delivery.webp'),
  },
  {
    id: '2',
    tag: 'Billing',
    title: 'Online Bills &\nDigital Payments',
    desc: 'Track dues and pay your monthly bill right from the app.',
    image: require('../../../assets/bills.webp'),
  },
  {
    id: '3',
    tag: 'Flexibility',
    title: 'Skip or Pause\nAnytime',
    desc: 'Going on vacation? Skip delivery with a single tap.',
    image: require('../../../assets/skip.webp'),
  },
  {
    id: '4',
    tag: 'Coverage',
    title: 'Papers in Every\nLanguage',
    desc: 'Kannada, Hindi, Tamil, Malayalam, English & more.',
    image: require('../../../assets/langauges.webp'),
  },
];

export default function HomeScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [papers, setPapers] = useState(store.getPapers());
  const [appSettings, setAppSettings] = useState(store.getAppSettings());
  const [updateInfo, setUpdateInfo] = useState<RemoteVersionInfo | null>(null);

  // ── Check for updates from GitHub on mount ──────────────────────────────────
  useEffect(() => {
    checkForUpdate().then((info) => {
      if (info) setUpdateInfo(info);
    });
  }, []);

  const contactAgent = () => {
    Linking.openURL('tel:9972505709');
  };

  const whatsappAgent = () => {
    Linking.openURL('https://api.whatsapp.com/send?phone=919972505709');
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'Newspaper Delivery App',
        message:
          '📰 Daily newspaper delivery to your doorstep!\n\n' +
          'Subscribe to 40+ papers in Kannada, English, Hindi, Tamil, Telugu & Malayalam. ' +
          'Skip or pause anytime. Get your paper by 6:30 AM every morning.\n\n' +
          'Download the app now:\n' +
          'https://play.google.com/store/apps/details?id=com.newspaper.deliveryapp',
      });
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
      setPapers(store.getPapers());
      setAppSettings(store.getAppSettings());
    });
    return unsubscribe;
  }, []);

  const customerDeliveries = (deliveries || []).filter((d) => d?.name === user?.name && d?.plan !== 'One-time');
  const currentDelivery = customerDeliveries[0] || null;
  const showOnlinePay =
    !!user &&
    !user?.isAdmin &&
    user?.customerKind === 'legacy' &&
    user?.approvalStatus === 'approved';

  const [slideIndex, setSlideIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ── Auto-advancing carousel — works reliably on Android ────────────────────
  useEffect(() => {
    const total = APP_FEATURES.length;
    if (total <= 1) return;

    const interval = setInterval(() => {
      // Fade out → swap slide → fade in
      setSlideIndex((prev) => (prev + 1) % total);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
      router.push('/customer/login');
      return;
    }

    if (!currentDelivery && (action.id === 'skip' || action.id === 'pause')) {
      Alert.alert('No Subscription', 'You don\'t have any active deliveries to skip or pause.');
      return;
    }

    if (action.id === 'skip' || action.id === 'pause') {
      router.push('/customer/manage_subscription');
    }
  };

  const requireAuth = (callback: () => void) => {
    if (!user) {
      router.push('/customer/login');
    } else {
      callback();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" animated={true} />

      {/* ── IN-APP UPDATE MODAL ─────────────────────────────────────────── */}
      <Modal
        visible={!!updateInfo}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!updateInfo?.mandatory) setUpdateInfo(null); }}
      >
        <View style={styles.updateOverlay}>
          <View style={styles.updateCard}>
            <View style={styles.updateIconRow}>
              <Text style={{ fontSize: 36 }}>🚀</Text>
            </View>
            <Text style={styles.updateTitle}>Update Available!</Text>
            <Text style={styles.updateVersion}>Version {updateInfo?.version}</Text>

            {!!updateInfo?.releaseNotes && (
              <View style={styles.updateNotesBox}>
                <Text style={styles.updateNotesTitle}>What's new</Text>
                <Text style={styles.updateNotesText}>{updateInfo.releaseNotes}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.updateBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(updateInfo?.downloadUrl || '')}
            >
              <Text style={styles.updateBtnText}>Download Update</Text>
            </TouchableOpacity>

            {!updateInfo?.mandatory && (
              <TouchableOpacity
                style={styles.updateSkipBtn}
                onPress={() => setUpdateInfo(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.updateSkipText}>Remind me later</Text>
              </TouchableOpacity>
            )}

            {updateInfo?.mandatory && (
              <Text style={styles.updateMandatoryNote}>
                This update is required to continue using the app.
              </Text>
            )}
          </View>
        </View>
      </Modal>

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
      <TouchableOpacity
        style={styles.locationRow}
        activeOpacity={0.75}
        onPress={() => {
          if (!user) {
            router.push('/customer/login');
            return;
          }
          router.push('/customer/bottom_nav/profile');
        }}
      >
        <MapPin size={14} color="#2563EB" />
        <Text style={styles.locationText} numberOfLines={1}>
          {user?.address || 'Set your delivery location'}
        </Text>
        <ChevronDown size={13} color="#2563EB" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      >
        <View style={styles.body}>

          {/* ── AUTO-SCROLLING FEATURE ADS ─────────────────────────── */}
          <View style={[styles.todayCard, { flexDirection: 'column', alignItems: 'stretch', height: 175 }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left: feature text */}
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.featureTag}>{APP_FEATURES[slideIndex].tag.toUpperCase()}</Text>
                <Text style={styles.featureTitle}>{APP_FEATURES[slideIndex].title}</Text>
                <Text style={styles.featureDesc}>{APP_FEATURES[slideIndex].desc}</Text>
              </View>
              {/* Right: illustration */}
              <View style={styles.featureIconBox}>
                <Image source={APP_FEATURES[slideIndex].image} style={styles.featureImage} resizeMode="cover" />
              </View>
            </View>
          </View>

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



          {/* ── LANGUAGE FILTER BOX ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 15 }]}>Browse Newspapers by Language</Text>
            <TouchableOpacity onPress={() => router.push('/customer/newspapers' as any)}>
              <Text style={styles.viewAll}>All Papers →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.langGrid}>
            {[
              {
                key: 'Kannada',
                native: 'ಕನ್ನಡ',
                english: 'Kannada',
                tintDark: '#B45309',
                tintSoft: '#FFF7ED',
                borderTint: '#FED7AA',
              },
              {
                key: 'Hindi',
                native: 'हिन्दी',
                english: 'Hindi',
                tintDark: '#B91C1C',
                tintSoft: '#FEF2F2',
                borderTint: '#FECACA',
              },
              {
                key: 'Tamil',
                native: 'தமிழ்',
                english: 'Tamil',
                tintDark: '#1D4ED8',
                tintSoft: '#EFF6FF',
                borderTint: '#BFDBFE',
              },
              {
                key: 'Malayalam',
                native: 'മലയാളം',
                english: 'Malayalam',
                tintDark: '#15803D',
                tintSoft: '#F0FDF4',
                borderTint: '#BBF7D0',
              },
              {
                key: 'English',
                native: 'English',
                english: 'English',
                tintDark: '#4338CA',
                tintSoft: '#EEF2FF',
                borderTint: '#C7D2FE',
              },
              {
                key: 'All',
                native: 'All',
                english: 'Languages',
                tintDark: '#6D28D9',
                tintSoft: '#F5F3FF',
                borderTint: '#DDD6FE',
              },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.key}
                activeOpacity={0.75}
                style={[
                  styles.langTile,
                  {
                    width: LANG_TILE_W,
                    backgroundColor: lang.tintSoft,
                    borderColor: lang.borderTint,
                  },
                ]}
                onPress={() => router.push({
                  pathname: '/customer/newspapers' as any,
                  params: { lang: lang.key },
                } as any)}
              >
                <Text
                  style={[
                    styles.langNativeText,
                    { color: lang.tintDark },
                  ]}
                  numberOfLines={1}
                >
                  {lang.native}
                </Text>
                <Text
                  style={styles.langEnglishText}
                  numberOfLines={1}
                >
                  {lang.english}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* ── ACTIVE SUBSCRIPTION ───────────────────────────── */}
          {user && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Subscription</Text>
                <TouchableOpacity onPress={() => router.push('/customer/bottom_nav/papers')}>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {customerDeliveries.length > 0 ? (
                customerDeliveries.map((delivery, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activeCard}
                    onPress={() => router.push('/customer/manage_subscription')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.logoWrapper}>
                      <Image source={delivery?.src} style={{ width: '100%', height: '100%', borderRadius: 13 }} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.activeName}>{delivery?.paperName || 'Newspaper'}</Text>
                      <Text style={styles.activeMeta}>₹{delivery?.priceMonth || 0}/mo  •  {delivery?.plan || 'Monthly'}</Text>
                      <Text style={styles.activeNext}>Next Delivery: Tomorrow</Text>
                    </View>
                    <View>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>
                          {delivery?.status === 'Delivered' ? 'Delivered' : 'Active'}
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


          <View style={[styles.sectionHeader, { marginTop: 4, marginBottom: 8 }]}>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>

          <View style={styles.howItWorksCard}>
            {[
              {
                step: '1',
                title: 'Choose Your Newspaper',
                desc: 'Browse 40+ papers and magazines in Kannada, English, Hindi, Tamil, Telugu & Malayalam.',
                tintBg: '#EFF6FF',
                tintText: '#1D4ED8',
              },
              {
                step: '2',
                title: 'Subscribe in One Tap',
                desc: 'Pick daily or monthly plan. Pay via UPI, cash, or any method you prefer.',
                tintBg: '#F0FDF4',
                tintText: '#15803D',
              },
              {
                step: '3',
                title: 'Delivered to Your Door',
                desc: 'We drop your paper every morning by 6:30 AM — rain or shine, no excuses.',
                tintBg: '#FEF3C7',
                tintText: '#B45309',
              },
              {
                step: '4',
                title: 'Skip or Pause Anytime',
                desc: 'Going out of town? Skip a day or pause your subscription with a single tap.',
                tintBg: '#F5F3FF',
                tintText: '#6D28D9',
              },
            ].map((s, i) => (
              <View key={s.step} style={[styles.howPointRow, i !== 0 && styles.howPointRowDivider]}>
                <View style={[styles.howPointBadge, { backgroundColor: s.tintBg }]}>
                  <Text style={[styles.howPointNum, { color: s.tintText }]}>{s.step}</Text>
                </View>
                <View style={styles.howPointTextCol}>
                  <Text style={styles.howPointTitle}>{s.title}</Text>
                  <Text style={styles.howPointDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.sectionHeader, { marginTop: 14 }]}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactHeaderRow}>
              <View style={styles.contactAvatar}>
                <FontAwesome name="headphones" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.contactTitle}>Customer Support</Text>
                <Text style={styles.contactSub}>7 AM – 9 PM daily</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={styles.contactActionsRow}>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#EEF2FF' }]}
                activeOpacity={0.75}
                onPress={contactAgent}
              >
                <FontAwesome name="phone" size={14} color="#2563EB" />
                <Text style={[styles.contactBtnText, { color: '#2563EB' }]}>Call</Text>
                <Text style={styles.contactBtnMeta}>9972505709</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#E8FBF0' }]}
                activeOpacity={0.75}
                onPress={whatsappAgent}
              >
                <Image
                  source={{ uri: 'https://raw.githubusercontent.com/WalkxCode/dashboard-icons/main/png/whatsapp.png' }}
                  style={{ width: 14, height: 14 }}
                />
                <Text style={[styles.contactBtnText, { color: '#15803D' }]}>WhatsApp</Text>
                <Text style={styles.contactBtnMeta}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionHeader, { marginTop: 14 }]}>
            <Text style={styles.sectionTitle}>Share with Friends</Text>
          </View>

          <View style={styles.shareCard}>
            <View style={styles.shareEmojiBox}>
              <Text style={{ fontSize: 22 }}>🎉</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.shareTitle}>Invite Friends & Family</Text>
              <Text style={styles.shareDesc}>
                Share this app so your loved ones also get daily newspaper delivery!
              </Text>
              <TouchableOpacity
                style={styles.shareBtn}
                activeOpacity={0.8}
                onPress={handleShareApp}
              >
                <FontAwesome name="share-alt" size={12} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share App</Text>
              </TouchableOpacity>
            </View>
          </View>

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
  upiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  upiTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: -0.2 },
  upiSub: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  upiId: { marginTop: 10, fontSize: 13, fontWeight: '900', color: '#2563EB' },
  upiName: { marginTop: 2, fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  upiMissing: { marginTop: 10, fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  upiPayBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  upiPayBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  upiQrBox: {
    width: 96,
    height: 96,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiQrImage: { width: '100%', height: '100%' },
  confirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, alignSelf: 'flex-start', marginTop: 10,
  },
  confirmedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  todayLogoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  bannerMediaCard: {
    width: 104,
    height: 104,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'visible',
    padding: 0,
  },
  bannerMediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
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

  /* ── CATEGORY TILES (Card style) ───────── */
  homeCategoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  homeCategoryCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  homeCatImage: {
    width: 80,
    height: 90,
    marginBottom: 8,
  },
  homeCatSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  homeCatLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  homeCatSub: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 13,
    textAlign: 'center',
  },

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
    width: 80, height: 80,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
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
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  paperLang: { fontSize: 12, color: '#64748B', marginTop: 1 },
  priceText: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 },
  subBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 7,
  },
  subBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  /* ── Browse carousel styles ── */
  browseBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  featureTag: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 7,
    lineHeight: 18,
  },
  featureIconBox: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  langBadgeBox: {
    width: 104,
    height: 104,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  langBadgeNative: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  /* Language filter tiles — minimal tinted boxes */
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: LANG_GAP,
    rowGap: LANG_GAP,
    marginBottom: 22,
  },
  langTile: {
    minHeight: 74,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  langNativeText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  langEnglishText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },

  /* ── Update Modal ──────────────────────────────── */
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  updateIconRow: {
    width: 68,
    height: 68,
    backgroundColor: '#EFF6FF',
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  updateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  updateVersion: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 16,
  },
  updateNotesBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  updateNotesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  updateNotesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  updateBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  updateSkipBtn: {
    paddingVertical: 8,
  },
  updateSkipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  updateMandatoryNote: {
    marginTop: 8,
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
  },

  /* ── How It Works section (vertical point list) ──── */
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  howPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  howPointRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  howPointBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    marginRight: 12,
    flexShrink: 0,
  },
  howPointNum: {
    fontSize: 11,
    fontWeight: '900',
  },
  howPointTextCol: {
    flex: 1,
  },
  howPointTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  howPointDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },

  /* ── Contact Us section ───────────────────────── */
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  contactBtnMeta: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },

  /* ── Share with Friends ───────────────────── */
  shareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  shareEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  shareDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  shareBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    marginTop: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
