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
import { MapPin, RefreshCw, Mail, Lock, Eye, EyeOff, Phone, User, CheckCircle } from 'lucide-react-native';
import { store } from '../../utils/store';
import { fetchUser, updateUser } from '../../database';
import { hashPassword, verifyPassword } from '../../utils/passwordHash';
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
  // Structured address fields (4 fields)
  const [houseNo, setHouseNo] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResetPassword = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!resetPhone || !phoneRegex.test(resetPhone)) {
      showToast('Please enter a valid 10-digit Indian phone number', false);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', false);
      return;
    }

    setResetLoading(true);
    try {
      const user = await fetchUser(resetPhone);
      if (!user) {
        showToast('No account found with this phone number', false);
        setResetLoading(false);
        return;
      }

      // Hash the new password before storing (SECURE)
      const hashedPassword = await hashPassword(newPassword);
      await updateUser(resetPhone, { password: hashedPassword });
      showToast('Password reset successfully!');
      setForgotPasswordModalVisible(false);
      setResetPhone('');
      setNewPassword('');
    } catch (error) {
      showToast('Failed to reset password', false);
    } finally {
      setResetLoading(false);
    }
  };

  const validateForm = () => {
    // Email validation - proper email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isLogin && (!email || !emailRegex.test(email))) {
      showToast('Please enter a valid email address (e.g., name@email.com)', false);
      return false;
    }
    
    // Phone validation - exactly 10 digits, India only
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      showToast('Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9)', false);
      return false;
    }
    
    // Password validation - minimum 6 characters
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', false);
      return false;
    }
    
    // Confirm password for signup
    if (!isLogin && password !== confirmPassword) {
      showToast('Passwords do not match', false);
      return false;
    }
    
    // Name validation - only letters and spaces, minimum 2 characters
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!isLogin && (!name || !nameRegex.test(name.trim()))) {
      showToast('Please enter a valid name (letters only, minimum 2 characters)', false);
      return false;
    }
    
    // Address validation - structured fields like Swiggy/Zomato
    if (!isLogin) {
      // At minimum, require area and city
      if (!area || area.trim().length < 3) {
        showToast('Please enter your area/street (minimum 3 characters)', false);
        return false;
      }
      if (!city || city.trim().length < 2) {
        showToast('Please enter your city', false);
        return false;
      }
      // Pincode validation - exactly 6 digits
      if (pincode && pincode.length !== 6) {
        showToast('Please enter a valid 6-digit pincode', false);
        return false;
      }
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

        // Navigate to home after successful login
        const user = store.getUser();
        if (user?.isAdmin) {
          router.replace('/customer/bottom_nav/admin');
        } else {
          router.replace('/customer/bottom_nav/home');
        }
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

        // After signup, switch to login mode with phone number pre-filled
        showToast('Account created! Please login.');
        setPhone(phone.trim());
        setPassword('');
        setIsLogin(true);
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

        // Verify password using hash comparison (SECURE)
        const passwordMatch = await verifyPassword(password, userByPhone.password || '');
        if (!passwordMatch) {
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

        // Navigate to home after successful login
        const user = store.getUser();
        if (user?.isAdmin) {
          router.replace('/customer/bottom_nav/admin');
        } else {
          router.replace('/customer/bottom_nav/home');
        }
      } else {
        // Signup: Combine structured address fields
        const fullAddress = [
          houseNo.trim(),
          area.trim(),
          city.trim(),
          pincode.trim(),
        ].filter(Boolean).join(', ');

        // Hash password before storing (SECURE)
        const hashedPassword = await hashPassword(password);

        // Signup: create new user with hashed password
        const newUser = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: fullAddress,
          password: hashedPassword, // Store HASHED password (secure)
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

        // After signup, switch to login mode with phone number pre-filled
        showToast('Account created! Please login.');
        setPhone(phone.trim());
        setPassword('');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast('Authentication failed', false);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = phone.length === 10 && password.length >= 6 && 
    (isLogin ? true : (email.includes('@') && password === confirmPassword && name.trim().length > 0 && area.trim().length > 0 && city.trim().length > 0));

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
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericText = text.replace(/[^0-9]/g, '');
                  setPhone(numericText);
                }}
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

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <TouchableOpacity onPress={() => setForgotPasswordModalVisible(true)} style={s.forgotPasswordBtn}>
                <Text style={s.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

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
                {confirmPassword && password !== confirmPassword && (
                  <Text style={s.passwordError}>Passwords do not match</Text>
                )}
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
                    autoCapitalize="words"
                    value={name}
                    onChangeText={(text) => {
                      // Only allow letters and spaces
                      const letterText = text.replace(/[^a-zA-Z\s]/g, '');
                      setName(letterText);
                    }}
                  />
                </View>
              </>
            )}

            {/* Address (Signup only) - Structured like Swiggy/Zomato */}
            {!isLogin && (
              <>
                <Text style={s.label}>Delivery Address</Text>

                {/* House/Flat No */}
                <View style={s.inputContainer}>
                  <MapPin size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="House/Flat No."
                    placeholderTextColor="#9CA3AF"
                    value={houseNo}
                    onChangeText={setHouseNo}
                  />
                </View>

                {/* Area/Street */}
                <View style={s.inputContainer}>
                  <MapPin size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Area/Street"
                    placeholderTextColor="#9CA3AF"
                    value={area}
                    onChangeText={setArea}
                  />
                </View>

                {/* City */}
                <View style={s.inputContainer}>
                  <MapPin size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                {/* Pincode */}
                <View style={s.inputContainer}>
                  <MapPin size={18} color="#9CA3AF" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Pincode (6 digits)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={pincode}
                    onChangeText={setPincode}
                  />
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

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotPasswordModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Reset Password</Text>
            <Text style={s.modalSubtitle}>Enter your phone number and new password</Text>
            
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
                value={resetPhone}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  setResetPhone(numericText);
                }}
              />
            </View>

            <Text style={s.label}>New Password</Text>
            <View style={s.inputContainer}>
              <Lock size={18} color="#9CA3AF" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => {
                  setForgotPasswordModalVisible(false);
                  setResetPhone('');
                  setNewPassword('');
                }}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalConfirmBtn}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.modalConfirmText}>Reset</Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: BLUE,
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    color: '#BFDBFE',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
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
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
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
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  passwordError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginBottom: 10,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    padding: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  existingCustomerText: {
    flex: 1,
  },
  existingCustomerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  existingCustomerSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
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
    fontSize: 14,
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  termsLink: {
    paddingHorizontal: 4,
  },
  termsLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
    textDecorationLine: 'underline',
  },
  termsSeparator: {
    fontSize: 12,
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