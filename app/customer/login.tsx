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
import { MapPin, RefreshCw, Mail, Lock, Eye, EyeOff, Phone, User, CheckCircle } from 'lucide-react-native';
import { store } from '../../utils/store';
import { fetchUser } from '../../database';
// import auth from '@react-native-firebase/auth'; // Uncomment for production APK

const BLUE = '#2563EB';
const BLUE_DARK = '#1D4ED8';
const BLUE_LIGHT = '#EFF6FF';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
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

  const validateForm = () => {
    // Email required for signup (Firebase Auth), optional for login
    if (!isLogin && (!email || !email.includes('@'))) {
      showToast('Please enter a valid email', false);
      return false;
    }
    // Phone is always required (for database key and login)
    if (!phone || phone.length !== 10) {
      showToast('Please enter a valid 10-digit phone number', false);
      return false;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', false);
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      showToast('Passwords do not match', false);
      return false;
    }
    if (!isLogin && name.trim().length === 0) {
      showToast('Please enter your name', false);
      return false;
    }
    if (!isLogin && address.trim().length === 0) {
      showToast('Please enter your delivery address', false);
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Firebase Auth - Uncomment for production APK
      /*
      if (isLogin) {
        // Login with phone number + password
        const authPhone = phone.trim();

        // Fetch user by phone number to get their email
        const userByPhone = await fetchUser(authPhone);
        if (!userByPhone || !userByPhone.email) {
          showToast('No account found with this phone number', false);
          setLoading(false);
          return;
        }

        // Verify password from Firestore
        if (userByPhone.password !== password) {
          showToast('Wrong password', false);
          setLoading(false);
          return;
        }

        // Authenticate with Firebase Auth using the email from Firestore
        const userCredential = await auth().signInWithEmailAndPassword(userByPhone.email, password);
        const fbUser = userCredential.user;

        store.setUser({
          name: userByPhone.name,
          phone: userByPhone.phone ?? '',
          email: fbUser.email ?? undefined,
          address: userByPhone.address,
          isAdmin: userByPhone.isAdmin || false,
          customerKind: userByPhone.customerKind ?? 'new',
          approvalStatus: userByPhone.approvalStatus ?? 'approved',
        });
        showToast('Welcome back!');
      } else {
        // Signup with email, phone, password, name, address
        const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
        const fbUser = userCredential.user;

        const newUser = {
          name: name.trim(),
          phone: phone.trim(),
          email: fbUser.email ?? undefined,
          address: address.trim(),
          password: password, // Store password in Firestore
          isAdmin: false,
          customerKind: existingCustomer ? 'legacy' : 'new',
          approvalStatus: existingCustomer ? 'pending' : 'approved',
          createdAt: new Date().toISOString(),
        };

        const { saveUser } = await import('../../database');
        await saveUser(newUser);

        store.setUser(newUser);
        showToast('Account created successfully!');
      }
      */

      // Temporary direct login for Expo Go testing
      if (isLogin) {
        // Login: fetch user from Firestore by phone number
        const authPhone = phone.trim();
        const userByPhone = await fetchUser(authPhone);

        if (!userByPhone) {
          showToast('No account found with this phone number', false);
          setLoading(false);
          return;
        }

        // Verify password
        if (userByPhone.password !== password) {
          showToast('Wrong password', false);
          setLoading(false);
          return;
        }

        store.setUser({
          name: userByPhone.name,
          phone: userByPhone.phone ?? '',
          email: userByPhone.email,
          address: userByPhone.address,
          isAdmin: userByPhone.isAdmin || false,
          customerKind: userByPhone.customerKind ?? 'new',
          approvalStatus: userByPhone.approvalStatus ?? 'approved',
        });
        showToast('Welcome back!');
      } else {
        // Signup: create new user with password
        const newUser = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          password: password, // Store password in Firestore
          isAdmin: false,
          customerKind: (existingCustomer ? 'legacy' : 'new') as 'new' | 'legacy',
          approvalStatus: (existingCustomer ? 'pending' : 'approved') as 'pending' | 'approved',
          createdAt: new Date().toISOString(),
        };

        try {
          const { saveUser } = await import('../../database');
          await saveUser(newUser);
        } catch (error) {
          console.error('Error saving user:', error);
        }

        store.setUser(newUser);
        showToast('Account created successfully!');
      }

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

  const canProceed = phone.length === 10 && password.length >= 6 && 
    (isLogin ? true : (email.includes('@') && password === confirmPassword && name.trim().length > 0 && address.trim().length > 0));

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Toast */}
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#16A34A' : '#DC2626' }]}>
          <Text style={s.toastText}>{toast.msg}</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerIcon}>📰</Text>
        <Text style={s.headerTitle}>Newspaper<Text style={s.headerAccent}>Delivery</Text></Text>
        <Text style={s.headerSubtitle}>Your daily newspaper, at your doorstep</Text>
      </View>

      {/* Form */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.form}>
            {/* Login/Signup Toggle */}
            <View style={s.toggleContainer}>
              <TouchableOpacity
                style={[s.toggleButton, isLogin && s.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleText, isLogin && s.toggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleButton, !isLogin && s.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleText, !isLogin && s.toggleTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Email (Signup only - required for Firebase Auth) */}
            {!isLogin && (
              <>
                <Text style={s.label}>Email Address</Text>
                <View style={s.inputContainer}>
                  <Mail size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </>
            )}

            {/* Phone Number (Always required for database key and login) */}
            <Text style={s.label}>Phone Number</Text>
            <View style={s.inputContainer}>
              <Phone size={18} color="#9CA3AF" style={s.inputIcon} />
              <Text style={s.countryCode}>+91</Text>
              <TextInput
                style={[s.input, s.phoneInput]}
                placeholder="10-digit number"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Password */}
            <Text style={s.label}>Password</Text>
            <View style={s.inputContainer}>
              <Lock size={18} color="#9CA3AF" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeIcon}>
                {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <>
                <Text style={s.label}>Confirm Password</Text>
                <View style={s.inputContainer}>
                  <Lock size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={s.eyeIcon}>
                    {showConfirmPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Name (Signup only) */}
            {!isLogin && (
              <>
                <Text style={s.label}>Your Name</Text>
                <View style={s.inputContainer}>
                  <User size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </>
            )}

            {/* Address (Signup only) */}
            {!isLogin && (
              <>
                <Text style={s.label}>Delivery Address</Text>
                <View style={s.inputContainer}>
                  <MapPin size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Your doorstep address"
                    placeholderTextColor="#9CA3AF"
                    value={address}
                    onChangeText={setAddress}
                    onFocus={() => { if (!address) openLocationModal(); }}
                  />
                  <TouchableOpacity style={s.gpsButton} onPress={openLocationModal}>
                    <Text style={s.gpsButtonText}>📍 GPS</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Existing Customer Toggle (Signup only) */}
            {!isLogin && (
              <TouchableOpacity
                style={s.existingCustomerContainer}
                onPress={() => setExistingCustomer(!existingCustomer)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, existingCustomer && s.checkboxChecked]}>
                  {existingCustomer && <CheckCircle size={14} color="#FFFFFF" />}
                </View>
                <View style={s.existingCustomerText}>
                  <Text style={s.existingCustomerTitle}>Existing customer</Text>
                  <Text style={s.existingCustomerSubtitle}>Tick if you are a previous active customer</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[s.submitButton, !canProceed && s.submitButtonDisabled]}
              disabled={!canProceed || loading}
              onPress={handleAuth}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.submitButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            {/* Terms & Privacy Links */}
            <View style={s.termsContainer}>
              <TouchableOpacity style={s.termsLink} onPress={() => router.push('/terms')}>
                <Text style={s.termsLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={s.termsSeparator}>•</Text>
              <TouchableOpacity style={s.termsLink} onPress={() => router.push('/privacy')}>
                <Text style={s.termsLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Modal */}
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
                <ActivityIndicator size="large" color={BLUE} />
                <Text style={s.modalTitle}>Fetching your address...</Text>
                <Text style={s.modalSubtitle}>Getting your current location</Text>
              </>
            ) : locationError ? (
              <>
                <View style={s.errorIcon}>
                  <RefreshCw size={28} color="#EF4444" />
                </View>
                <Text style={s.modalTitle}>Failed to get address</Text>
                <Text style={s.modalSubtitle}>Could not detect your location automatically</Text>
                <TouchableOpacity style={s.retryButton} onPress={fetchGPS}>
                  <RefreshCw size={14} color="#FFFFFF" />
                  <Text style={s.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelButton} onPress={() => setLocationModalVisible(false)}>
                  <Text style={s.cancelButtonText}>Cancel</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toast: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    zIndex: 99,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: BLUE,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    color: '#BFDBFE',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: BLUE,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  phoneInput: {
    marginLeft: 6,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  eyeIcon: {
    padding: 6,
  },
  gpsButton: {
    backgroundColor: BLUE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  gpsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: BLUE,
  },
  existingCustomerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  existingCustomerText: {
    flex: 1,
  },
  existingCustomerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  existingCustomerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  termsLink: {
    paddingHorizontal: 4,
  },
  termsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
    textDecorationLine: 'underline',
  },
  termsSeparator: {
    fontSize: 13,
    color: '#94A3B8',
    marginHorizontal: 4,
  },
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
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 14,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});