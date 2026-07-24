import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { IMAGES } from '../assets/images';

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Illustration top section */}
      <View style={styles.illustrationContainer}>
        <Image
          source={IMAGES.onboarding}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Your Daily News{'\n'}Delivered <Text style={{ color: '#2563EB' }}>Fresh</Text>
        </Text>

        <Text style={styles.subtitle}>
          Subscribe to your favorite newspapers and get them delivered to your doorstep every morning.
        </Text>

        {/* Dot indicators */}
        <View style={styles.indicatorRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Get Started CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/customer/bottom_nav/home')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Get Started</Text>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
