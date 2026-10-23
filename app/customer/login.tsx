import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, RefreshCw, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { store } from '../../utils/store';
import { fetchUser } from '../../database';
// import auth from '@react-native-firebase/auth'; // Commented for Expo Go testing

const BLUE = '#2563EB';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchGPS = async () => {
    setLoadingLoc(true);
    setLocationError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        showToast('Location permission denied', false);
        setLoadingLoc(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo.length > 0) {
        const a = geo[0];
        const parts: string[] = [];
        if (a.name && !a.name.includes('+') && isNaN(Number(a.name))) parts.push(a.name);
        if (a.street && a.street !== a.name) parts.push(a.street);
        if (a.district) parts.push(a.district);
        else if (a.subregion) parts.push(a.subregion);
        if (a.city) parts.push(a.city);
        if (a.postalCode) parts.push(a.postalCode);
        setAddress(parts.filter(Boolean).join(', '));
        showToast('Location detected!');
        setLocationModalVisible(false);
      } else {
        setLocationError(true);
        showToast('Could not detect address', false);
      }
    } catch {
      setLocationError(true);
      showToast('GPS error', false);
    } finally {
      setLoadingLoc(false);
    }
  };

  const openLocationModal = () => {
    setLocationError(false);
    setLocationModalVisible(true);
    fetchGPS();
  };

  const handleAuth = async () => {
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email', false);
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', false);
      return;
    }
    if (!isLogin && name.trim().length === 0) {
      showToast('Please enter your name', false);
      return;
    }
    if (!isLogin && address.trim().length === 0) {
      showToast('Please enter your delivery address', false);
      return;
    }

    setLoading(true);
    try {
      // Firebase Auth - Commented for Expo Go testing
      // Uncomment when using production APK
      /*
      if (isLogin) {
        // Sign In
        const userCredential = await auth().signInWithEmailAndPassword(email.trim(), password);
        const fbUser = userCredential.user;

        let existingUser: any = null;
        try { existingUser = await fetchUser(fbUser.email || ''); } catch { // not in DB }

        if (existingUser) {
          store.setUser({
            name: existingUser.name,
            phone: existingUser.phone ?? '',
            email: fbUser.email ?? undefined,
            address: existingUser.address,
            isAdmin: existingUser.isAdmin || false,
            customerKind: existingUser.customerKind ?? 'new',
            approvalStatus: existingUser.approvalStatus ?? 'approved',
          });
          showToast('Welcome back!');
        } else {
          showToast('No account found. Please create an account.', false);
        }
      } else {
        // Sign Up
        const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
        const fbUser = userCredential.user;

        store.setUser({
          name: name.trim(),
          email: fbUser.email ?? undefined,
          phone: '',
          address: address.trim(),
          isAdmin: false,
          customerKind: 'new',
          approvalStatus: 'approved',
        });

        showToast('Account created successfully!');
      }
      */

      // Temporary direct login for Expo Go testing
      // Remove this when using production APK with Firebase Auth
      store.setUser({
        name: isLogin ? 'Test User' : name.trim(),
        email: email.trim(),
        phone: '',
        address: isLogin ? 'Test Address' : address.trim(),
        isAdmin: false,
        customerKind: 'new',
        approvalStatus: 'approved',
      });

      showToast(isLogin ? 'Welcome back!' : 'Account created successfully!');

      const user = store.getUser();
      if (user?.isAdmin) {
        router.replace('/customer/bottom_nav/admin');
      } else {
        router.replace('/customer/bottom_nav/home');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast('Authentication failed', false);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = email.includes('@') && password.length >= 6 && (isLogin || (name.trim().length > 0 && address.trim().length > 0));

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Toast */}
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#16A34A' : '#DC2626' }]}>
          <Text style={s.toastTxt}>{toast.msg}</Text>
        </View>
      )}

      {/* ── Blue Header ── */}
      <View style={s.header}>
        <Text style={s.headerIcon}>📰</Text>
        <Text style={s.headerTitle}>Newspaper<Text style={s.headerAccent}>Delivery</Text></Text>
        <Text style={s.headerSub}>Your daily newspaper, at your doorstep</Text>
      </View>

      {/* ── White Form Sheet ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetContainer}>
        <View style={s.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Login/Signup Toggle */}
            <View style={s.toggleContainer}>
              <TouchableOpacity
                style={[s.toggleButton, isLogin && s.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[s.toggleText, isLogin && s.toggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleButton, !isLogin && s.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[s.toggleText, !isLogin && s.toggleTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Email & Password */}
            <Text style={s.lbl}>Email Address</Text>
            <View style={s.inpRow}>
              <Mail size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#111827', fontWeight: '600', paddingVertical: 0 }}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={s.lbl}>Password</Text>
            <View style={s.inpRow}>
              <Lock size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#111827', fontWeight: '600', paddingVertical: 0 }}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>

            {/* Sign Up only fields */}
            {!isLogin && (
              <>
                <Text style={s.lbl}>Your Name</Text>
                <TextInput
                  style={s.inp}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={s.lbl}>Delivery Address</Text>
                <View style={s.inpRow}>
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#111827', fontWeight: '600', paddingVertical: 0 }}
                    placeholder="Your doorstep address"
                    placeholderTextColor="#9CA3AF"
                    value={address}
                    onChangeText={setAddress}
                    onFocus={() => { if (!address) openLocationModal(); }}
                    editable={true}
                  />
                  <TouchableOpacity style={s.gpsPill} onPress={openLocationModal}>
                    <MapPin size={12} color="#2563EB" />
                    <Text style={s.gpsTxt}>GPS</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[s.cta, !canProceed && s.ctaOff]}
              disabled={!canProceed || loading}
              onPress={handleAuth}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[s.ctaTxt, !canProceed && s.ctaTxtOff]}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={s.terms}>By continuing, you agree to our Terms & Privacy Policy</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Location Fetching Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {loadingLoc ? (
              <>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={s.modalTitle}>Fetching your address...</Text>
                <Text style={s.modalSub}>Getting your current location</Text>
              </>
            ) : locationError ? (
              <>
                <View style={s.errorIcon}>
                  <RefreshCw size={32} color="#EF4444" />
                </View>
                <Text style={s.modalTitle}>Failed to get address</Text>
                <Text style={s.modalSub}>Could not detect your location automatically</Text>
                <TouchableOpacity style={s.retryBtn} onPress={fetchGPS}>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={s.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setLocationModalVisible(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },

  toast: {
    position: 'absolute', top: 52, left: 20, right: 20, zIndex: 99,
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, elevation: 8,
  },
  toastTxt: { color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 36, paddingHorizontal: 28 },
  headerIcon: { fontSize: 40, marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  headerAccent: { color: '#BFDBFE' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: '500' },

  sheetContainer: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheet: { flex: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  lbl: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  inp: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, height: 50, fontSize: 15,
    color: '#111827', fontWeight: '600', marginBottom: 14, backgroundColor: '#FAFAFA',
  },
  inpRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, height: 50, backgroundColor: '#FAFAFA',
  },
  inpText: {
    flex: 1, fontSize: 15, color: '#111827', fontWeight: '600',
  },

  gpsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE',
  },
  gpsTxt: { fontSize: 11, fontWeight: '800', color: BLUE },

  cta: {
    backgroundColor: BLUE, borderRadius: 13, height: 52,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 4, marginTop: 4,
  },
  ctaOff: { backgroundColor: '#F3F4F6', shadowOpacity: 0, elevation: 0 },
  ctaTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  ctaTxtOff: { color: '#9CA3AF' },

  terms: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});