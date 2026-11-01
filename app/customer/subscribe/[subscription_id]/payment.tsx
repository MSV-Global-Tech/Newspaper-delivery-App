import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, Modal, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, X, Phone, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import PaperLogo from '../../../../components/PaperLogo';
import { store } from '../../../../utils/store';
import { IMAGES } from '../../../../assets/images';

const SUBSCRIPTION_FEE = 50; // Fixed 50 Rs

export default function PaymentScreen() {
  const { subscription_id } = useLocalSearchParams<{ subscription_id: string }>();
  const [papers, setPapers] = useState(store.getPapers());
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setPapers(store.getPapers());
    });
    return unsubscribe;
  }, []);

  // Language display mapping (Kannada/English)
  const getLanguageDisplay = (lang: string) => {
    const langMap: Record<string, string> = {
      'Kannada': 'ಕನ್ನಡ/Kannada',
      'English': 'English',
      'Hindi': 'हिंदी/Hindi',
      'Tamil': 'தமிழ்/Tamil',
      'Telugu': 'తెలుగు/Telugu',
      'Malayalam': 'മലയാളം/Malayalam',
    };
    return langMap[lang] || lang;
  };

  const paper = papers.find(p => p.id === subscription_id) || papers[0] || {
    id: '1',
    name: 'Publication',
    language: 'English',
    category: 'Paper' as const,
    priceDay: 5,
    priceMonth: 150,
    rating: 4.5,
    src: IMAGES.vijayavani,
  };

  // Owner contact details
  const ownerContact = {
    name: 'Newspaper Delivery Owner',
    phone: '9972505709',
    address: '123 Main Street, City',
    email: 'owner@newspaperdelivery.com'
  };

  const handlePayNow = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setShowPayment(false);
    setPaymentSuccess(true);
    Alert.alert('Payment Successful', `Your subscription has been activated! Payment ID: ${paymentId}`);
  };

  const handlePaymentFailed = (error: string) => {
    setShowPayment(false);
    Alert.alert('Payment Failed', error);
  };

  const handleCallOwner = () => {
    Linking.openURL(`tel:${ownerContact.phone}`);
  };

  // Razorpay HTML for payment
  const razorpayHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <script>
        var options = {
          key: 'rzp_live_SuVsRVG2xaLYv4',
          amount: ${SUBSCRIPTION_FEE * 100},
          currency: 'INR',
          name: 'Newspaper Delivery',
          description: 'Subscription for ${paper.name}',
          image: 'https://example.com/logo.png',
          handler: function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              status: 'success', 
              paymentId: response.razorpay_payment_id 
            }));
          },
          prefill: {
            name: 'Customer Name',
            email: 'customer@email.com',
            contact: '9999999999'
          },
          theme: {
            color: '#2563EB'
          }
        };
        var rzp = new Razorpay(options);
        rzp.open();
      </script>
    </body>
    </html>
  `;

  if (paymentSuccess) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace('/customer/bottom_nav/home')} style={s.backButton}>
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Subscription Complete</Text>
          <View style={s.headerSpacer} />
        </View>

        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {/* Success Message */}
          <View style={s.successCard}>
            <CheckCircle size={64} color="#16A34A" />
            <Text style={s.successTitle}>Payment Successful!</Text>
            <Text style={s.successText}>Your subscription for {paper.name} has been activated.</Text>
          </View>

          {/* Newspaper Info */}
          <View style={s.infoCard}>
            <PaperLogo id={paper.id} name={paper.name} imageSrc={paper.imageSrc} size={80} />
            <View style={s.infoText}>
              <Text style={s.infoTitle}>{paper.name}</Text>
              <Text style={s.infoSubtitle}>{getLanguageDisplay(paper.language)} • {paper.category}</Text>
              <Text style={s.infoPrice}>₹{SUBSCRIPTION_FEE} Paid</Text>
            </View>
          </View>

          {/* Owner Contact */}
          <View style={s.contactCard}>
            <Text style={s.contactTitle}>Owner Contact Details</Text>
            <Text style={s.contactSubtitle}>You can contact the owner anytime:</Text>

            <TouchableOpacity style={s.contactItem} onPress={handleCallOwner}>
              <Phone size={20} color="#2563EB" />
              <View style={s.contactItemText}>
                <Text style={s.contactItemLabel}>Phone</Text>
                <Text style={s.contactItemValue}>{ownerContact.phone}</Text>
              </View>
              <Text style={s.contactAction}>Call</Text>
            </TouchableOpacity>

            <View style={s.contactItem}>
              <MapPin size={20} color="#64748B" />
              <View style={s.contactItemText}>
                <Text style={s.contactItemLabel}>Address</Text>
                <Text style={s.contactItemValue}>{ownerContact.address}</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={s.instructionsCard}>
            <Text style={s.instructionsTitle}>Next Steps</Text>
            <Text style={s.instructionsText}>
              1. Your subscription is now active
            </Text>
            <Text style={s.instructionsText}>
              2. Owner will deliver newspaper to your address
            </Text>
            <Text style={s.instructionsText}>
              3. Keep your payment receipt for reference
            </Text>
          </View>

          <TouchableOpacity 
            style={s.doneButton}
            onPress={() => router.replace('/customer/bottom_nav/home')}
          >
            <Text style={s.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Newspaper Details */}
        <View style={s.paperCard}>
          <PaperLogo id={paper.id} name={paper.name} imageSrc={paper.imageSrc} size={100} />
          <View style={s.paperText}>
            <Text style={s.paperTitle}>{paper.name}</Text>
            <Text style={s.paperSubtitle}>{getLanguageDisplay(paper.language)} • {paper.category}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={s.paymentCard}>
          <Text style={s.paymentTitle}>Subscription Fee</Text>
          <Text style={s.paymentAmount}>₹{SUBSCRIPTION_FEE}</Text>
          <Text style={s.paymentSubtitle}>One-time payment for subscription activation</Text>
        </View>

        {/* Payment Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Payment Summary</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Newspaper Subscription</Text>
            <Text style={s.summaryValue}>₹{SUBSCRIPTION_FEE}</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryTotal}>Total</Text>
            <Text style={s.summaryTotalValue}>₹{SUBSCRIPTION_FEE}</Text>
          </View>
        </View>

        {/* Note */}
        <View style={s.noteCard}>
          <Text style={s.noteTitle}>Note</Text>
          <Text style={s.noteText}>
            You have already contacted the owner. Payment will activate your subscription immediately.
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity style={s.payButton} onPress={handlePayNow}>
          <Text style={s.payButtonText}>Pay ₹{SUBSCRIPTION_FEE}</Text>
        </TouchableOpacity>

        <Text style={s.secureText}>
          🔒 Secure payment via Razorpay
        </Text>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" onRequestClose={() => setShowPayment(false)}>
        <View style={s.paymentModal}>
          <TouchableOpacity 
            style={s.closePayment} 
            onPress={() => setShowPayment(false)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <WebView
            source={{ html: razorpayHtml }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            onMessage={(event: any) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.status === 'success') {
                  handlePaymentSuccess(data.paymentId);
                } else if (data.status === 'failed') {
                  handlePaymentFailed(data.error || 'Payment failed');
                }
              } catch (e) {
                console.error(e);
              }
            }}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  paperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  paperText: {
    flex: 1,
    marginLeft: 12,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  paperSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 5,
  },
  paymentAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 3,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  noteCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 3,
  },
  noteText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  payButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secureText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  paymentModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closePayment: {
    position: 'absolute',
    top: 45,
    right: 18,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 18,
    padding: 7,
  },
  successCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 14,
    marginBottom: 5,
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 3,
  },
  infoPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16A34A',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 7,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactItemText: {
    flex: 1,
    marginLeft: 12,
  },
  contactItemLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 1,
  },
  contactItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  contactAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 13,
    color: '#1E3A8A',
    marginBottom: 7,
    lineHeight: 17,
  },
  doneButton: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});