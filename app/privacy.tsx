import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const BLUE = '#2563EB';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={s.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last Updated: November 1, 2026</Text>

        <Text style={s.sectionTitle}>1. Information We Collect</Text>
        <Text style={s.sectionText}>
          We collect the following personal information to provide our newspaper delivery service:
        </Text>
        <Text style={s.sectionText}>
          • Phone Number (10-digit Indian mobile number){'\n'}
          • Email Address{'\n'}
          • Full Name{'\n'}
          • Delivery Address{'\n'}
          • Location Data (with your permission for GPS-based address detection){'\n'}
          • Payment Information (processed securely through Razorpay)
        </Text>

        <Text style={s.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={s.sectionText}>
          We use your information to:
        </Text>
        <Text style={s.sectionText}>
          • Process and activate your newspaper subscription{'\n'}
          • Deliver newspapers to your registered address{'\n'}
          • Communicate delivery updates and service information{'\n'}
          • Process subscription payments{'\n'}
          • Verify your identity for account access{'\n'}
          • Provide customer support
        </Text>

        <Text style={s.sectionTitle}>3. Information Sharing</Text>
        <Text style={s.sectionText}>
          We do not sell, rent, or lease your personal information to third parties. We may share your information only with:
        </Text>
        <Text style={s.sectionText}>
          • Payment processors (Razorpay) for transaction processing{'\n'}
          • Delivery personnel for newspaper delivery{'\n'}
          • Service providers who assist in app operations (under strict confidentiality agreements)
        </Text>

        <Text style={s.sectionTitle}>4. Data Security</Text>
        <Text style={s.sectionText}>
          We implement industry-standard security measures to protect your data:
        </Text>
        <Text style={s.sectionText}>
          • Your data is stored securely in Firebase Firestore{'\n'}
          • Payment information is processed through Razorpay's secure payment gateway{'\n'}
          • We use encryption for data transmission{'\n'}
          • Access to your data is restricted to authorized personnel only
        </Text>

        <Text style={s.sectionTitle}>5. Password Security</Text>
        <Text style={s.sectionText}>
          To protect your account, we use advanced password security measures:
        </Text>
        <Text style={s.sectionText}>
          • Passwords are hashed using SHA-256 encryption before storage{'\n'}
          • Your actual password is never stored in our database{'\n'}
          • Even if our database is compromised, your password cannot be extracted{'\n'}
          • We recommend using strong, unique passwords for your account
        </Text>
        <Text style={s.sectionText}>
          Note: Your phone number is stored in plaintext as it is used as your account identifier for delivery services. This is safe and necessary for our operations.
        </Text>

        <Text style={s.sectionTitle}>6. Location Data</Text>
        <Text style={s.sectionText}>
          With your permission, we may access your device's GPS location to:
        </Text>
        <Text style={s.sectionText}>
          • Auto-detect your delivery address{'\n'}
          • Ensure accurate newspaper delivery{'\n'}
          • Provide location-based services
        </Text>
        <Text style={s.sectionText}>
          Location data is used solely for delivery purposes and is not shared with third parties. You can revoke location permission at any time through your device settings.
        </Text>

        <Text style={s.sectionTitle}>7. Account Security</Text>
        <Text style={s.sectionText}>
          Your account is protected by your phone number and password. You are responsible for:
        </Text>
        <Text style={s.sectionText}>
          • Keeping your password confidential{'\n'}
          • Notifying us immediately of unauthorized access{'\n'}
          • Ensuring the security of your device
        </Text>

        <Text style={s.sectionTitle}>8. Your Rights</Text>
        <Text style={s.sectionText}>
          You have the right to:
        </Text>
        <Text style={s.sectionText}>
          • Access your personal information{'\n'}
          • Update your profile information (name, address, email){'\n'}
          • Request deletion of your account and data{'\n'}
          • Opt out of non-essential communications{'\n'}
          • View your subscription and payment history
        </Text>

        <Text style={s.sectionTitle}>9. Data Retention</Text>
        <Text style={s.sectionText}>
          We retain your personal information for as long as your account is active or as necessary to provide our services. After account deletion, your data will be removed from our active databases within 30 days, except as required by law.
        </Text>

        <Text style={s.sectionTitle}>10. Third-Party Services</Text>
        <Text style={s.sectionText}>
          Our app uses the following third-party services:
        </Text>
        <Text style={s.sectionText}>
          • Firebase (for data storage and authentication){'\n'}
          • Razorpay (for payment processing){'\n'}
          • Expo (for app framework and services)
        </Text>
        <Text style={s.sectionText}>
          These services have their own privacy policies. We encourage you to review them.
        </Text>

        <Text style={s.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={s.sectionText}>
          We may update this privacy policy from time to time. Significant changes will be notified through the app or via email. Continued use of the app after changes constitutes acceptance of the new policy.
        </Text>

        <Text style={s.sectionTitle}>12. Contact Information</Text>
        <Text style={s.sectionText}>
          If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
        </Text>
        <Text style={s.sectionText}>
          Phone: 9972505709{'\n'}
          Email: owner@newspaperdelivery.com
        </Text>

        <View style={s.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
  footer: {
    height: 20,
  },
});