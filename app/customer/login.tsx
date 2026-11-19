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
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, RefreshCw, Mail, Lock, Eye, EyeOff, Phone, User, CheckCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { store } from '../../utils/store';
import { fetchUser, updateUser, fetchUserByEmail, saveUser } from '../../database';
import { hashPassword, verifyPassword } from '../../utils/passwordHash';
import auth from '@react-native-firebase/auth';

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
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to detect your address. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setIsDetectingLocation(false);
        return;
      }

      // Check if location services are enabled
      const isLocationServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationServicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use auto-detect. You can also enter your address manually below.',
          [
            { text: 'Enter Manually', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setIsDetectingLocation(false);
        setLocationDetected(true); // Allow manual entry
        return;
      }

      // Try to get location with retries (up to 3 attempts)
      let location = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && !location) {
        attempts++;
        try {
          // Use high accuracy for faster results
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          break; // Success, exit loop
        } catch (error) {
          console.log(`Location attempt ${attempts} failed:`, error);
          if (attempts < maxAttempts) {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!location) {
        throw new Error('Failed to get location after multiple attempts');
      }

      const { latitude, longitude } = location.coords;
      setLocationCoords({ latitude, longitude });

      // Try reverse geocoding to get address components
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'NewspaperDeliveryApp/1.0',
              'Accept-Language': 'en-IN,en'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const fullAddress = data.display_name || '';
            
            // Extract and auto-fill address components
            const pincodeMatch = fullAddress.match(/\b\d{6}\b/);
            if (pincodeMatch) setPincode(pincodeMatch[0]);
            
            // Extract city/district/state
            let detectedCity = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.district || '';
            setCity(detectedCity);
            
            // Extract area
            let detectedArea = addr.suburb || addr.neighbourhood || addr.road || addr.village || '';
            setArea(detectedArea);
            
            // Extract house number
            setHouseNo(addr.house_number || '');
            
            // Set full address
            setAddress(fullAddress);
            
            setLocationDetected(true);
            showToast('Location detected! You can edit the address if needed.');
            return;
          }
        }
      } catch (geocodingError) {
        console.error('Geocoding failed:', geocodingError);
      }

      // If geocoding fails, still mark as detected for manual entry
      setLocationDetected(true);
      showToast('Location detected! Please enter your address manually.');
    } catch (error) {
      console.error('Location error:', error);
      
      Alert.alert(
        'Location Detection Failed',
        'Could not detect your location. Please check your GPS signal or enter your address manually.',
        [
          { text: 'Enter Manually', style: 'cancel' },
          { text: 'Try Again', onPress: () => handleDetectLocation() }
        ]
      );
      
      // Still allow manual entry
      setLocationDetected(true);
      showToast('You can enter your address manually below.');
    } finally {
      setIsDetectingLocation(false);
    }
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
    // Email validation - strict format with proper domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!isLogin && (!email || !emailRegex.test(email))) {
      showToast('Please enter a valid email address (e.g., name@gmail.com, name@yahoo.com)', false);
      return false;
    }

    // Additional check: ensure domain has proper TLD (at least 2 letters)
    if (!isLogin) {
      const domainParts = email.split('@');
      if (domainParts.length !== 2 || !domainParts[1]) {
        showToast('Please enter a valid email address with proper domain', false);
        return false;
      }
      const domain = domainParts[1];
      const tld = domain.split('.').pop();
      if (!tld || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
        showToast('Please enter a valid email address with proper domain extension (.com, .in, .org, etc.)', false);
        return false;
      }
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
      // Location detection is mandatory
      if (!locationDetected || !locationCoords) {
        showToast('Please detect your location using the auto-detect button', false);
        return false;
      }
      // At minimum, require area (auto-detected or manual)
      if (!area || area.trim().length < 3) {
        showToast('Please enter your area/street (minimum 3 characters)', false);
        return false;
      }
      // City is optional if auto-detection fails
      // Pincode validation - exactly 6 digits if provided
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
      if (isLogin) {
        // Step 1: Login with phone + password (current system)
        const authPhone = phone.trim();
        const userByPhone = await fetchUser(authPhone);

        if (!userByPhone) {
          showToast('No account found with this phone number', false);
          setLoading(false);
          return;
        }

        // Verify password using hash comparison
        const passwordMatch = await verifyPassword(password, userByPhone.password || '');
        if (!passwordMatch) {
          showToast('Wrong password', false);
          setLoading(false);
          return;
        }

        // Step 2: Authenticate with Firebase using email (for security token)
        if (userByPhone.email) {
          try {
            console.log('Attempting Firebase Auth with email:', userByPhone.email);
            await auth().signInWithEmailAndPassword(userByPhone.email, password);
            console.log('Firebase Auth successful');
          } catch (firebaseError: any) {
            console.error('Firebase Auth error:', firebaseError.code, firebaseError.message);
            
            // If Firebase user doesn't exist, create it
            if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
              try {
                console.log('Creating Firebase Auth user...');
                await auth().createUserWithEmailAndPassword(userByPhone.email, password);
                console.log('Firebase Auth user created successfully');
              } catch (createError: any) {
                console.error('Firebase Auth create error:', createError.code, createError.message);
                // If email already in use, this means the Firebase user exists but password doesn't match
                // This is a critical error - show to user
                if (createError.code === 'auth/email-already-in-use') {
                  showToast('Email already registered with different password. Please use password reset.', false);
                  setLoading(false);
                  return;
                }
                // For other errors, log but continue (Firebase Auth is optional for basic functionality)
                console.error('Firebase Auth failed, continuing without it');
              }
            } else if (firebaseError.code === 'auth/wrong-password') {
              showToast('Email password mismatch. Please reset your password.', false);
              setLoading(false);
              return;
            } else {
              // For other Firebase errors, log but continue
              console.error('Firebase Auth error, continuing without it:', firebaseError.code);
            }
          }
        }

        // Step 3: Set user in store
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
        // Signup: Check if phone number already exists
        const existingUserByPhone = await fetchUser(phone.trim());
        
        // If phone exists and is a vendor (created by admin), update it instead of creating new
        if (existingUserByPhone && (existingUserByPhone as any).isVendor) {
          console.log('Vendor record found, updating with email/password');
          
          // Update the existing vendor record with email and password
          const hashedPassword = await hashPassword(password);
          
          // Create Firebase Auth user with email + password
          try {
            console.log('Creating Firebase Auth user for vendor signup...');
            await auth().createUserWithEmailAndPassword(email.trim(), password);
            console.log('Firebase Auth user created successfully');
          } catch (firebaseError: any) {
            console.error('Firebase Auth signup error:', firebaseError.code, firebaseError.message);
            if (firebaseError.code === 'auth/email-already-in-use') {
              showToast('This email is already registered. Please login.', false);
              setLoading(false);
              return;
            } else if (firebaseError.code === 'auth/weak-password') {
              showToast('Password is too weak. Use at least 6 characters.', false);
              setLoading(false);
              return;
            } else if (firebaseError.code === 'auth/invalid-email') {
              showToast('Invalid email address', false);
              setLoading(false);
              return;
            }
            console.error('Firebase Auth failed, continuing without it');
          }

          // Update the vendor record
          const address = `${houseNo.trim()}, ${area.trim()}, ${city.trim()}-${pincode.trim()}`;
          const updatedUser = {
            ...existingUserByPhone,
            name: name.trim(),
            email: email.trim(),
            address: address,
            password: hashedPassword,
            approvalStatus: 'approved' as 'approved' | 'pending' | 'rejected',
          };

          await saveUser(updatedUser);
          
          showToast('Vendor account created successfully! Please login.');
          setPhone(phone.trim());
          setPassword('');
          setIsLogin(true);
          setLoading(false);
          return;
        }
        
        // If phone exists but is not a vendor, show error
        if (existingUserByPhone) {
          showToast('An account with this phone number already exists. Please login.', false);
          setLoading(false);
          return;
        }

        // Signup: Check if email already exists
        const existingUserByEmail = await fetchUserByEmail(email.trim());
        if (existingUserByEmail) {
          showToast('An account with this email already exists. Please use a different email.', false);
          setLoading(false);
          return;
        }

        // Combine structured address fields
        const fullAddress = [
          houseNo.trim(),
          area.trim(),
          city.trim(),
          pincode.trim(),
        ].filter(Boolean).join(', ');

        // Hash password before storing
        const hashedPassword = await hashPassword(password);

        // Create Firebase Auth user with email + password
        try {
          console.log('Creating Firebase Auth user for signup...');
          await auth().createUserWithEmailAndPassword(email.trim(), password);
          console.log('Firebase Auth user created successfully');
        } catch (firebaseError: any) {
          console.error('Firebase Auth signup error:', firebaseError.code, firebaseError.message);
          if (firebaseError.code === 'auth/email-already-in-use') {
            showToast('This email is already registered. Please login.', false);
            setLoading(false);
            return;
          } else if (firebaseError.code === 'auth/weak-password') {
            showToast('Password is too weak. Use at least 6 characters.', false);
            setLoading(false);
            return;
          } else if (firebaseError.code === 'auth/invalid-email') {
            showToast('Invalid email address', false);
            setLoading(false);
            return;
          }
          // For other errors, continue without Firebase Auth (fallback to phone/password only)
          console.error('Firebase Auth failed, continuing without it');
        }

        // Create user in Firestore with phone as document ID
        const newUser = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: fullAddress,
          password: hashedPassword, // Store HASHED password
          isAdmin: false,
          customerKind: (existingCustomer ? 'legacy' : 'new') as 'new' | 'legacy',
          approvalStatus: (existingCustomer ? 'pending' : 'approved') as 'pending' | 'approved',
          createdAt: new Date().toISOString(),
          location: locationCoords, // Store GPS coordinates for verification
        };

        await saveUser(newUser);

        // After signup, switch to login mode with phone number pre-filled
        showToast('Account created! Please login.');
        setPhone(phone.trim());
        setPassword('');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast('Authentication failed. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = phone.length === 10 && password.length >= 6 &&
    (isLogin ? true : (
      // Strict email validation
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) &&
      // Additional domain check
      email.split('@').length === 2 &&
      (email.split('@')[1]?.split('.').pop()?.length || 0) >= 2 &&
      // Other validations
      password === confirmPassword &&
      name.trim().length > 0 &&
      area.trim().length > 0 &&
      locationDetected
    ));

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

                {/* Auto Detect Location Button */}
                <TouchableOpacity
                  style={[s.autoDetectBtn, locationDetected && s.autoDetectBtnDetected]}
                  onPress={handleDetectLocation}
                  disabled={isDetectingLocation}
                  activeOpacity={0.8}
                >
                  {isDetectingLocation ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : locationDetected ? (
                    <>
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={s.autoDetectBtnText}>Location Detected</Text>
                    </>
                  ) : (
                    <>
                      <MapPin size={16} color="#FFFFFF" />
                      <Text style={s.autoDetectBtnText}>Auto Detect Location</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Detected Location (Read-only) */}
                {locationDetected && (
                  <View style={s.detectedLocationBox}>
                    <MapPin size={16} color="#2563EB" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={s.detectedLocationTitle}>Detected Location</Text>
                      <Text style={s.detectedLocationText} numberOfLines={2}>
                        {address || 'Location detected'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Manual Entry Fields */}
                <Text style={[s.label, { marginTop: 16 }]}>Enter Your Address Details</Text>

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
              <TouchableOpacity style={s.termsLink} onPress={() => {}}>
                <Text style={s.termsLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={s.termsSeparator}>•</Text>
              <TouchableOpacity style={s.termsLink} onPress={() => {}}>
                <Text style={s.termsLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={s.termsSeparator}>•</Text>
              <TouchableOpacity style={s.termsLink} onPress={() => router.push('/vendor/login')}>
                <Text style={s.termsLinkText}>Are you a vendor?</Text>
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
  autoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  detectedLocationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detectedLocationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  detectedLocationText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  autoDetectBtnDetected: {
    backgroundColor: '#16A34A',
  },
  autoDetectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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