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
        <Text style={s.lastUpdated}>Last Updated: November 1, 2026</Text>

        <Text style={s.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={s.sectionText}>
          By downloading, accessing, or using the Newspaper Delivery app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
        </Text>

        <Text style={s.sectionTitle}>2. Account Registration</Text>
        <Text style={s.sectionText}>
          To use our services, you must register an account with a valid 10-digit Indian phone number, email address, name, and delivery address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </Text>

        <Text style={s.sectionTitle}>3. Subscription Services</Text>
        <Text style={s.sectionText}>
          Our app provides daily newspaper delivery services. Users can subscribe to available newspapers for a one-time subscription fee of ₹50. Subscription activation requires contacting the owner for delivery confirmation before payment.
        </Text>

        <Text style={s.sectionTitle}>4. Delivery Policy</Text>
        <Text style={s.sectionText}>
          Newspapers are delivered daily to the address provided during registration. We strive for timely delivery but are not responsible for delays caused by weather conditions, strikes, transportation issues, or other circumstances beyond our control. Missed deliveries should be reported within 24 hours.
        </Text>

        <Text style={s.sectionTitle}>5. Payment Terms</Text>
        <Text style={s.sectionText}>
          All payments are processed securely through Razorpay. The subscription fee of ₹50 is a one-time payment for service activation. Payments are non-refundable once delivery has commenced. For any payment-related issues, contact support within 7 days of payment.
        </Text>

        <Text style={s.sectionTitle}>6. User Responsibilities</Text>
        <Text style={s.sectionText}>
          Users must provide accurate and complete information during registration. You must ensure your delivery address is accessible. Users are responsible for updating their contact information or address if it changes. False or misleading information may result in service termination.
        </Text>

        <Text style={s.sectionTitle}>7. New vs Existing Customers</Text>
        <Text style={s.sectionText}>
          New customers will have their subscription activated after approval. Existing customers may need to provide additional verification to continue or resume service. Approval status is determined by the delivery owner based on location availability and service capacity.
        </Text>

        <Text style={s.sectionTitle}>8. Privacy and Data Protection</Text>
        <Text style={s.sectionText}>
          We collect and store your phone number, email, name, and delivery address for service delivery purposes. Your data is protected as per our Privacy Policy. We do not share your personal information with third parties except as necessary for service delivery.
        </Text>

        <Text style={s.sectionTitle}>9. Communication</Text>
        <Text style={s.sectionText}>
          By using our app, you agree to receive communications regarding your subscription, delivery updates, and service-related information via phone, email, or in-app notifications. You may opt out of marketing communications but not essential service updates.
        </Text>

        <Text style={s.sectionTitle}>10. Suspension and Termination</Text>
        <Text style={s.sectionText}>
          We reserve the right to suspend or terminate your subscription for violation of these terms, non-payment, or misuse of service. Users may cancel their subscription by contacting the owner. Refunds, if applicable, will be processed on a pro-rata basis.
        </Text>

        <Text style={s.sectionTitle}>11. Limitation of Liability</Text>
        <Text style={s.sectionText}>
          We are not liable for any indirect, incidental, or consequential damages arising from the use of our service. Our liability is limited to the subscription fee paid by the user.
        </Text>

        <Text style={s.sectionTitle}>12. Governing Law</Text>
        <Text style={s.sectionText}>
          These terms are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.
        </Text>

        <Text style={s.sectionTitle}>13. Changes to Terms</Text>
        <Text style={s.sectionText}>
          We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms. Significant changes will be notified through the app.
        </Text>

        <Text style={s.sectionTitle}>14. Contact Information</Text>
        <Text style={s.sectionText}>
          For any questions regarding these Terms of Service, or for support with your subscription, please contact us:
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