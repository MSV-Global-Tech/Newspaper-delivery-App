import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, Modal, Linking, Share, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, X, Phone, MapPin, Download, Share2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library/legacy';
import PaperLogo from '../../../../components/PaperLogo';
import { store } from '../../../../utils/store';
import { IMAGES } from '../../../../assets/images';
import { addDelivery } from '../../../../database/deliveries';
import { addPayment } from '../../../../database/payments';
import { updateUser } from '../../../../database/users';

const SUBSCRIPTION_FEE = 50; // Fixed 50 Rs

export default function PaymentScreen() {
  const { subscription_id } = useLocalSearchParams<{ subscription_id: string }>();
  const [papers, setPapers] = useState(store.getPapers());
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [savingBill, setSavingBill] = useState(false);
  const billRef = useRef<View>(null);

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

  const handlePaymentSuccess = async (paymentId: string) => {
    setShowPayment(false);
    setPaymentSuccess(true);
    setPaymentId(paymentId);
    setPaymentDate(new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }));

    // Save subscription to database
    try {
      const user = store.getUser();
      if (!user?.phone) {
        console.error('User phone not found');
        return;
      }

      const userPhone = user.phone;

      // Add delivery subscription
      const deliveryId = await addDelivery({
        name: user.name || '',
        phone: userPhone,
        address: user.address || '',
        paperName: paper.name,
        imageSrc: paper.imageSrc || '',
        status: 'Pending',
        time: 'Daily',
        plan: 'Daily',
        startDate: new Date().toISOString(),
        paymentMethod: 'Razorpay',
        category: 'Newspaper',
      });

      // Save payment record
      await addPayment({
        customerName: user.name || '',
        customerPhone: userPhone,
        amount: SUBSCRIPTION_FEE,
        method: 'Razorpay',
        txnId: paymentId,
        status: 'Paid',
        forMonth: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        category: 'Newspaper',
        paperName: paper.name, // Store the specific paper name
      });

      // Save bill to user's bills array
      const currentBills = (user as any).bills || [];
      const newBill = {
        id: paymentId,
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        totalAmount: SUBSCRIPTION_FEE,
        status: 'Paid',
        paidAt: new Date().toISOString(),
        items: [{
          id: deliveryId,
          name: `${paper.name} Subscription`,
          amount: SUBSCRIPTION_FEE,
        }],
        paperName: paper.name,
        paymentMethod: 'Razorpay',
        txnId: paymentId,
      };

      await updateUser(userPhone, {
        bills: [...currentBills, newBill],
      } as any);

      console.log('Subscription saved successfully:', deliveryId);
    } catch (error) {
      console.error('Error saving subscription:', error);
      Alert.alert('Error', 'Payment successful but failed to save subscription. Please contact support.');
    }

    Alert.alert('Payment Successful', `Your subscription has been activated! Payment ID: ${paymentId}`);
  };

  const handlePaymentFailed = (error: string) => {
    setShowPayment(false);
    Alert.alert('Payment Failed', error);
  };

  const handleCallOwner = () => {
    Linking.openURL(`tel:${ownerContact.phone}`);
  };

  const handleSaveBill = async () => {
    try {
      setSavingBill(true);
      
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission to save the bill.');
        setSavingBill(false);
        return;
      }

      // Small delay to ensure view is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the bill as image
      const uri = await captureRef(billRef, {
        format: 'png',
        quality: 1,
      });

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      Alert.alert(
        'Bill Saved!',
        'Your bill has been saved to your photo gallery.',
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill. Please try again.');
    } finally {
      setSavingBill(false);
    }
  };

  const handleShareBill = async () => {
    try {
      setSavingBill(true);
      
      // Small delay to ensure view is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the bill as image
      const uri = await captureRef(billRef, {
        format: 'png',
        quality: 1,
      });

      // Share the image
      await Share.share({
        url: uri,
        title: 'Newspaper Delivery Bill',
      });
    } catch (error) {
      console.error('Error sharing bill:', error);
      Alert.alert('Error', 'Failed to share bill. Please try again.');
    } finally {
      setSavingBill(false);
    }
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
          key: 'rzp_test_SuVuCcW1RgCWJ2',
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
    const user = store.getUser();
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

          {/* D-Mart Style Receipt */}
          <View ref={billRef} style={s.receiptPaper}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              <Text style={s.receiptHeader}>NEWSPAPER DELIVERY</Text>
              <Text style={s.receiptSubHeader}>TAX INVOICE</Text>
              <Text style={s.dashedLine}>----------------------------------------</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={s.receiptMeta}>BILL NO: #{paymentId.slice(-8).toUpperCase()}</Text>
                <Text style={s.receiptMeta}>DATE: {paymentDate}</Text>
              </View>
              <Text style={s.receiptMeta}>CUSTOMER: {user?.name?.toUpperCase() || 'CUSTOMER'}</Text>
              <Text style={s.receiptMeta}>PHONE: {user?.phone || 'N/A'}</Text>
              <Text style={s.receiptMeta}>ADDRESS: {user?.address?.toUpperCase() || 'N/A'}</Text>
              <Text style={s.dashedLine}>----------------------------------------</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[s.receiptMeta, { fontWeight: '700' }]}>ITEM</Text>
                <Text style={[s.receiptMeta, { fontWeight: '700' }]}>AMOUNT</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={s.receiptMeta}>{paper.name.toUpperCase()} ({paper.category.toUpperCase()})</Text>
                <Text style={s.receiptMeta}>₹{SUBSCRIPTION_FEE}.00</Text>
              </View>
              <Text style={s.dashedLine}>----------------------------------------</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                <Text style={[s.receiptMeta, { fontSize: 16, fontWeight: '800' }]}>NET AMOUNT</Text>
                <Text style={[s.receiptMeta, { fontSize: 16, fontWeight: '800' }]}>₹{SUBSCRIPTION_FEE}.00</Text>
              </View>
              <Text style={s.dashedLine}>----------------------------------------</Text>
              <Text style={[s.receiptMeta, { textAlign: 'center', marginTop: 12, fontWeight: '700' }]}>*** THANK YOU ***</Text>
              <Text style={[s.receiptMeta, { textAlign: 'center', marginTop: 4, fontSize: 10 }]}>Payment ID: {paymentId}</Text>
              <Text style={[s.receiptMeta, { textAlign: 'center', marginTop: 4, fontSize: 10 }]}>Owner: {ownerContact.phone}</Text>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={s.actionButtons}>
            <TouchableOpacity 
              style={[s.actionButton, s.saveButton]}
              onPress={handleSaveBill}
              disabled={savingBill}
            >
              <Download size={18} color="#FFFFFF" />
              <Text style={s.actionButtonText}>{savingBill ? 'Saving...' : 'Save Bill'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[s.actionButton, s.shareButton]}
              onPress={handleShareBill}
              disabled={savingBill}
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={s.actionButtonText}>{savingBill ? 'Sharing...' : 'Share Bill'}</Text>
            </TouchableOpacity>
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
  receiptPaper: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
  },
  receiptHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000',
    letterSpacing: 1,
  },
  receiptSubHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#374151',
    marginTop: 4,
    marginBottom: 8,
  },
  dashedLine: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#000',
    marginVertical: 4,
  },
  receiptMeta: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#000',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  shareButton: {
    backgroundColor: '#16A34A',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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