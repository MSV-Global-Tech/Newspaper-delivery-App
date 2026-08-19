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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Eye, EyeOff } from 'lucide-react-native';
import { store } from '../../utils/store';
import { fetchUser, fetchVendorByCode, updateVendor } from '../../database';
// import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Future Firebase OTP state (commented out for direct login bypass):
  // const [otp, setOtp] = useState('');
  // const [otpSent, setOtpSent] = useState(false);
  // const [confirmation, setConfirmation] = useState<any>(null); // For future: useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchGPS = async () => {
    setLoadingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { showToast('Location denied', false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo.length > 0) {
        const a = geo[0];
        const parts = [];
        if (a.name && !a.name.includes('+') && isNaN(Number(a.name))) parts.push(a.name);
        if (a.street && a.street !== a.name) parts.push(a.street);
        if (a.district) parts.push(a.district); else if (a.subregion) parts.push(a.subregion);
        if (a.city) parts.push(a.city);
        if (a.postalCode) parts.push(a.postalCode);
        setAddress(parts.filter(Boolean).join(', '));
        showToast('Location detected!');
      }
    } catch { showToast('GPS error', false); }
    finally { setLoadingLoc(false); }
  };

  /*
  // Future Firebase OTP login handlers (commented out for direct login bypass):
  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    try {
      showToast('Sending OTP...');
      const formattedPhone = `+91${phone}`; // E.164 format for India
      const conf = await auth().signInWithPhoneNumber(formattedPhone);
      setConfirmation(conf);
      setOtpSent(true);
      showToast('OTP sent to your number!');
    } catch (e: any) {
      console.warn("OTP Send Error:", e);
      showToast('Failed to send OTP. Check console.');
    }
  };

  const handleLogin = async () => {
    if (!confirmation) {
      showToast('Session expired, request OTP again');
      return;
    }
    
    try {
      showToast('Verifying code...');
      await confirmation.confirm(otp);
      
      const isUserAdmin = store.getAdminNumbers().includes(phone);
      let existingUser = null;
      try {
        existingUser = await fetchUser(phone);
      } catch (e) {
        console.warn("Failed to fetch user from DB:", e);
      }
      
      if (existingUser) {
        store.setUser({
          name: existingUser.name,
          phone: existingUser.phone,
          address: existingUser.address,
          isAdmin: isUserAdmin,
        });
      } else {
        store.setUser({
          name: isUserAdmin ? 'Admin' : (name || 'Customer'),
          phone,
          address: isUserAdmin ? 'Admin HQ' : (address || 'Not Provided'),
          isAdmin: isUserAdmin,
        });
      }
      router.replace('/customer/bottom_nav/home');
    } catch (error: any) {
      console.warn("Invalid code:", error);
      showToast('Invalid OTP code');
    }
  };
  */

  const handleDirectLogin = async () => {    if (phone.length < 10) return;
    try {
      showToast('Logging in...');
      
      const isUserAdmin = store.getAdminNumbers().some(a => a.phone === phone);
      let existingUser = null;
      try {
        existingUser = await fetchUser(phone);
      } catch (e) {
        console.warn("Failed to fetch user from DB:", e);
      }
      
      if (existingUser) {
        const hydrated: any = {
          name: existingUser.name,
          phone: existingUser.phone,
          address: existingUser.address,
          isAdmin: isUserAdmin,
          customerKind: existingUser.customerKind ?? 'new',
          approvalStatus: existingUser.approvalStatus ?? 'pending',
        };
        store.setUser(hydrated);
        // No longer blocking — let customer in. QR/Pay is gated by approvalStatus in profile.
      } else {
        const customerKind = existingCustomer ? 'legacy' : 'new';
        const approvalStatus = existingCustomer ? 'pending' : 'approved';
        const created: any = {
          name: isUserAdmin ? 'Admin' : (name || 'Customer'),
          phone,
          address: isUserAdmin ? 'Admin HQ' : (address || 'Not Provided'),
          isAdmin: isUserAdmin,
          customerKind,
          approvalStatus,
        };
        store.setUser(created);
      }
      showToast('Logged in successfully!');
      if (isUserAdmin) {
        router.replace('/customer/bottom_nav/admin');
        return;
      }
      router.replace('/customer/bottom_nav/home');
    } catch (error: any) {
      console.warn("Login Error:", error);
      showToast('Failed to log in');
    }
  };

  const canProceed = phone.length === 10 && name.trim().length > 0 && address.trim().length > 0;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Toast */}
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#16A34A' : '#DC2626' }]}>
          <Text style={s.toastTxt}>{toast.msg}</Text>
        </View>
      )}

      {/* ── Blue Header ── */}
      <View style={s.header}>
        <Text style={s.headerIcon}>📰</Text>
        <Text style={s.headerTitle}>Paper<Text style={s.headerAccent}>Fresh</Text></Text>
        <Text style={s.headerSub}>Your daily newspaper, at your doorstep</Text>
      </View>

      {/* ── White Form Sheet ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetContainer}>
        <View style={s.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Customer fields */}
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
                      placeholder={loadingLoc ? 'Fetching current location...' : 'Your doorstep address'}
                      placeholderTextColor="#9CA3AF"
                      value={loadingLoc ? '' : address}
                      onChangeText={setAddress}
                      onFocus={() => { if (!address && !loadingLoc) fetchGPS(); }}
                      editable={!loadingLoc}
                    />
                    <TouchableOpacity style={s.gpsPill} onPress={fetchGPS}>
                      <MapPin size={12} color="#2563EB" />
                      <Text style={s.gpsTxt}>{loadingLoc ? '…' : 'GPS'}</Text>
                    </TouchableOpacity>
                  </View>
                </>

                {/* Phone */}
                <>
                  <Text style={s.lbl}>Mobile Number</Text>
                  <View style={s.inpRow}>
                    <Text style={s.flag}>🇮🇳 +91</Text>
                    <View style={s.divV} />
                    <TextInput
                      style={{ flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' }}
                      placeholder="10-digit number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                    {phone.length === 10 && <Text style={s.tick}>✓</Text>}
                  </View>
                </>

                <TouchableOpacity
                  style={s.legacyRow}
                  activeOpacity={0.85}
                  onPress={() => setExistingCustomer((v) => !v)}
                >
                  <View style={[s.legacyBox, existingCustomer && s.legacyBoxOn]}>
                    {existingCustomer && <Text style={s.legacyTick}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.legacyTitle}>Existing customer / ಪ್ರಸ್ತುತ ಗ್ರಾಹಕರು</Text>
                    <Text style={s.legacySub}>Tick if you are a previous active customer (needs admin approval) / ನೀವು ಹಿಂದಿನ ಸಕ್ರಿಯ ಗ್ರಾಹಕರಾದರೆ ಟಿಕ್ ಮಾಡಿ (ಅಡ್ಮಿನ್ ಅನುಮೋದನೆ ಬೇಕು)</Text>
                  </View>
                </TouchableOpacity>
            {/* OTP (commented out for direct login bypass) */}
            {/*
            {otpSent && (
              <>
                <Text style={s.lbl}>One-Time Password</Text>
                <View style={s.inpRow}>
                  <Lock size={16} color="#9CA3AF" />
                  <TextInput
                    style={{ flex: 1, fontSize: 18, color: '#111827', fontWeight: '800', letterSpacing: 8, marginLeft: 10 }}
                    placeholder="· · · ·"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={s.resend}>Resend</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.otpHint}>Sent to +91 {phone} · Demo OTP: 1234</Text>
              </>
            )}
            */}

            {/* CTA */}
            <TouchableOpacity
              style={[s.cta, !canProceed && s.ctaOff]}
              disabled={!canProceed}
              onPress={handleDirectLogin} // Originally: onPress={!otpSent ? handleSendOtp : handleLogin}
              activeOpacity={0.85}
            >
              <Text style={[s.ctaTxt, !canProceed && s.ctaTxtOff]}>
                Login & Continue
              </Text>
            </TouchableOpacity>

            <Text style={s.terms}>By continuing, you agree to our Terms & Privacy Policy</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BLUE = '#2563EB';

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
  flag: { fontSize: 13, fontWeight: '800', color: '#374151', marginRight: 4 },
  divV: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 10 },
  tick: { color: '#16A34A', fontSize: 16, fontWeight: '900' },
  legacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  legacyBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legacyBoxOn: {
    borderColor: BLUE,
    backgroundColor: BLUE,
  },
  legacyTick: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  legacyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  legacySub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 16,
  },
  gpsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE',
  },
  gpsTxt: { fontSize: 11, fontWeight: '800', color: BLUE },
  resend: { fontSize: 13, fontWeight: '700', color: BLUE },
  otpHint: { fontSize: 12, color: '#9CA3AF', marginTop: -8, marginBottom: 14 },

  cta: {
    backgroundColor: BLUE, borderRadius: 13, height: 52,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 4, marginTop: 4,
  },
  ctaOff: { backgroundColor: '#F3F4F6', shadowOpacity: 0, elevation: 0 },
  ctaTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  ctaTxtOff: { color: '#9CA3AF' },

  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  divTxt: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 50, borderRadius: 13, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  gTxt: { fontSize: 15, fontWeight: '700', color: '#374151' },

  terms: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
