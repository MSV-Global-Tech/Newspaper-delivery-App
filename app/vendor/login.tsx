import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Lock, User, Store } from 'lucide-react-native';
import { fetchVendorById, updateVendor } from '../../database/vendors';
import { store } from '../../utils/store';
import { setSessionUser } from '../../utils/session';

export default function VendorLoginScreen() {
  const [vendorId, setVendorId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!vendorId.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter vendor ID and secret code');
      return;
    }

    setLoading(true);
    try {
      const vendor = await fetchVendorById(vendorId.trim());
      
      if (!vendor) {
        Alert.alert('Error', 'Invalid vendor ID');
        setLoading(false);
        return;
      }

      // Check secret code (last 4 digits of phone)
      if (vendor.secretCode !== password.trim()) {
        Alert.alert('Error', 'Invalid secret code');
        setLoading(false);
        return;
      }

      // Create session token
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update vendor with new session token
      await updateVendor(vendor.id, { currentSessionToken: sessionToken });

      // Set user in store
      store.setUser({
        name: vendor.name,
        phone: vendor.phone || '',
        address: vendor.address || '',
        isAdmin: false,
        isVendor: true,
        vendorData: vendor,
        sessionToken,
      } as any);

      // Set session user
      setSessionUser({
        phone: vendor.phone || '',
        name: vendor.name,
        isAdmin: false,
        isVendor: true,
        vendorData: vendor,
        sessionToken,
      } as any);

      router.replace('/vendor/dashboard');
    } catch (error: any) {
      Alert.alert('Error', 'Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Store size={32} color="#2563EB" />
              <Text style={s.headerTitle}>Vendor Login</Text>
              <Text style={s.headerSubtitle}>Enter your credentials to continue</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <View style={s.form}>
            {/* Vendor ID */}
            <Text style={s.label}>Vendor ID</Text>
            <View style={s.inputContainer}>
              <User size={18} color="#9CA3AF" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Enter your vendor ID"
                placeholderTextColor="#9CA3AF"
                value={vendorId}
                onChangeText={setVendorId}
                autoCapitalize="characters"
              />
            </View>

            {/* Secret Code */}
            <Text style={s.label}>Secret Code</Text>
            <View style={s.inputContainer}>
              <Lock size={18} color="#9CA3AF" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Enter your secret code"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[s.submitButton, loading && s.submitButtonDisabled]}
              disabled={loading}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              <Text style={s.submitButtonText}>{loading ? 'Logging in...' : 'Login as Vendor'}</Text>
            </TouchableOpacity>

            {/* Back to Customer Login */}
            <TouchableOpacity
              style={s.backToCustomerBtn}
              onPress={() => router.replace('/customer/login')}
            >
              <Text style={s.backToCustomerText}>Back to Customer Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  form: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 20,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backToCustomerBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  backToCustomerText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
