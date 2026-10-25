import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const BLUE = '#2563EB';

export default function TermsScreen() {
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Terms of Service</Text>
        <View style={s.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last Updated: October 25, 2026</Text>

        <Text style={s.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={s.sectionText}>
          By accessing and using the Newspaper Delivery app, you accept and agree to be bound by the terms and provisions of this agreement.
        </Text>

        <Text style={s.sectionTitle}>2. User Responsibilities</Text>
        <Text style={s.sectionText}>
          Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.
        </Text>

        <Text style={s.sectionTitle}>3. Subscription Services</Text>
        <Text style={s.sectionText}>
          Newspaper delivery subscriptions are subject to availability. Payment is required in advance for the subscription period selected.
        </Text>

        <Text style={s.sectionTitle}>4. Delivery Policy</Text>
        <Text style={s.sectionText}>
          We strive to deliver newspapers on time every day. However, we are not responsible for delays caused by weather, strikes, or other circumstances beyond our control.
        </Text>

        <Text style={s.sectionTitle}>5. Payment Terms</Text>
        <Text style={s.sectionText}>
          All payments are processed securely. Refunds are subject to our refund policy and may take 7-10 business days to process.
        </Text>

        <Text style={s.sectionTitle}>6. User Content</Text>
        <Text style={s.sectionText}>
          Users agree not to post or transmit any content that is illegal, harmful, or violates the rights of others.
        </Text>

        <Text style={s.sectionTitle}>7. Privacy</Text>
        <Text style={s.sectionText}>
          Your use of our app is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the app and informs users of our data collection practices.
        </Text>

        <Text style={s.sectionTitle}>8. Termination</Text>
        <Text style={s.sectionText}>
          We reserve the right to terminate or suspend your account at any time for violation of these terms.
        </Text>

        <Text style={s.sectionTitle}>9. Changes to Terms</Text>
        <Text style={s.sectionText}>
          We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={s.sectionTitle}>10. Contact Us</Text>
        <Text style={s.sectionText}>
          If you have any questions about these Terms of Service, please contact us at support@newspaperdelivery.com
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