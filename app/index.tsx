import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Image, FlatList, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { IMAGES } from '../assets/images';
import { getHasSeenOnboarding, getLastRoute, getSessionUser, setHasSeenOnboarding } from '../utils/session';
import { store } from '../utils/store';
import { useEffect, useRef, useState } from 'react';

type Slide = {
  title: string;
  subtitle: string;
  accent?: string;
  bg: string;
  image: keyof typeof IMAGES;
};

const SLIDES: Slide[] = [
  {
    title: 'Your Daily News\nDelivered',
    accent: 'Fresh',
    subtitle: 'Subscribe to your favorite newspapers and get them delivered to your doorstep every morning.',
    bg: '#F8F8F6',
    image: 'splash1.webp',
  },
  {
    title: 'Pick Papers\nThat You Love',
    subtitle: 'Choose from multiple languages and manage your subscriptions anytime.',
    bg: '#F8F8F6',
    image: 'splash2.webp',
  },
];

export default function OnboardingScreen() {
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // null = still deciding (render nothing → no onboarding flash on re-open)
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const width = Dimensions.get('window').width;

  // Boot gate: decide BEFORE rendering anything.
  // Onboarding tour is shown ONLY on first install (never seen before).
  // Returning users are routed straight in without seeing this screen.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [hasSeenOnboarding, sessionUser, lastRoute] = await Promise.all([
        getHasSeenOnboarding(),
        getSessionUser(),
        getLastRoute(),
      ]);

      if (sessionUser) store.setUser(sessionUser as any);
      if (!mounted) return;

      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
        return;
      }

      if (sessionUser) {
        router.replace((lastRoute ?? '/customer/bottom_nav/home') as any);
        return;
      }

      router.replace('/customer/login');
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const goNext = () => {
    const next = Math.min(activeIndex + 1, SLIDES.length - 1);
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  };

  const onGetStarted = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/customer/bottom_nav/home');
  };

  // While deciding (or while redirecting), show a plain white screen that
  // blends with the native splash — no onboarding flash.
  if (showOnboarding !== true) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={SLIDES}
        keyExtractor={(_, idx) => String(idx)}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const idx = Math.round(x / width);
          setActiveIndex(Math.max(0, Math.min(idx, SLIDES.length - 1)));
        }}
        renderItem={({ item: s }) => (
          <View style={{ width, flex: 1 }}>
            <View style={[styles.illustrationContainer, { backgroundColor: s.bg }]}>
              <Image source={IMAGES[s.image]} style={styles.illustrationImage} resizeMode="contain" />
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.title}>
                {s.title}
                {s.accent ? ' ' : ''}
                {s.accent ? <Text style={{ color: '#2563EB' }}>{s.accent}</Text> : null}
              </Text>

              <Text style={styles.subtitle}>{s.subtitle}</Text>

              <View style={styles.indicatorRow}>
                {SLIDES.map((_, dotIdx) => {
                  const isActive = dotIdx === activeIndex;
                  return <View key={dotIdx} style={[styles.dot, isActive && styles.dotActive]} />;
                })}
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={activeIndex === SLIDES.length - 1 ? onGetStarted : goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6, opacity: activeIndex === SLIDES.length - 1 ? 1 : 0.9 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    flex: 1.4,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  illustrationImage: {
    width: '85%',
    height: '85%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#2563EB',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
