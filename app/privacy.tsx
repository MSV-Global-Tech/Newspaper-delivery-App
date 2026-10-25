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
        <Text style={s.lastUpdated}>Last Updated: October 25, 2026</Text>

        <Text style={s.sectionTitle}>1. Information We Collect</Text>
        <Text style={s.sectionText}>
          We collect information you provide directly, including your name, phone number, email address, delivery address, and payment information.
        </Text>

        <Text style={s.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={s.sectionText}>
          We use your information to process your subscription, deliver newspapers to your address, process payments, and communicate with you about your service.
        </Text>

        <Text style={s.sectionTitle}>3. Information Sharing</Text>
        <Text style={s.sectionText}>
          We do not sell your personal information. We may share your information with service providers who assist us in operating our app, such as payment processors and delivery partners.
        </Text>

        <Text style={s.sectionTitle}>4. Data Security</Text>
        <Text style={s.sectionText}>
          We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.
        </Text>

        <Text style={s.sectionTitle}>5. Location Data</Text>
        <Text style={s.sectionText}>
          We may collect your location data to ensure accurate newspaper delivery. This data is used solely for delivery purposes and is not shared with third parties.
        </Text>

        <Text style={s.sectionTitle}>6. Payment Information</Text>
        <Text style={s.sectionText}>
          Payment information is processed securely through third-party payment processors. We do not store your complete credit card information on our servers.
        </Text>

        <Text style={s.sectionTitle}>7. Your Rights</Text>
        <Text style={s.sectionText}>
          You have the right to access, update, or delete your personal information. You may also opt out of marketing communications at any time.
        </Text>

        <Text style={s.sectionTitle}>8. Cookies and Tracking</Text>
        <Text style={s.sectionText}>
          We may use cookies and similar technologies to improve your experience and analyze app usage. You can manage your cookie preferences in your device settings.
        </Text>

        <Text style={s.sectionTitle}>9. Children's Privacy</Text>
        <Text style={s.sectionText}>
          Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.
        </Text>

        <Text style={s.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={s.sectionText}>
          We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page.
        </Text>

        <Text style={s.sectionTitle}>11. Contact Us</Text>
        <Text style={s.sectionText}>
          If you have any questions about this Privacy Policy, please contact us at privacy@newspaperdelivery.com
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