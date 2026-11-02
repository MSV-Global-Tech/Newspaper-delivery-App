import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Linking, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Phone, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import PaperLogo from '../../../../components/PaperLogo';
import { store } from '../../../../utils/store';
import { IMAGES } from '../../../../assets/images';
import { updateUser } from '../../../../database/users';

const SUBSCRIPTION_FEE = 50; // Fixed 50 Rs

export default function ContactScreen() {
  const { subscription_id } = useLocalSearchParams<{ subscription_id: string }>();
  const [papers, setPapers] = useState(store.getPapers());
  const [contacted, setContacted] = useState(false);

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

  // Owner contact details - you can update these
  const ownerContact = {
    name: 'Newspaper Delivery Owner',
    phone: '9972505709',
    email: 'owner@newspaperdelivery.com'
  };

  const handleCallOwner = () => {
    Linking.openURL(`tel:${ownerContact.phone}`);
    setContacted(true);
    // Save contacted status to Firestore
    const user = store.getUser();
    if (user?.phone) {
      updateUser(user.phone, { contactedOwner: true } as any).catch(err => console.error('Error saving contacted status:', err));
    }
  };

  const handleMessageOwner = () => {
    Linking.openURL(`whatsapp://send?phone=${ownerContact.phone}&text=Hi, I want to subscribe to ${paper.name}`);
    setContacted(true);
    // Save contacted status to Firestore
    const user = store.getUser();
    if (user?.phone) {
      updateUser(user.phone, { contactedOwner: true } as any).catch(err => console.error('Error saving contacted status:', err));
    }
  };

  const handleProceedToPayment = () => {
    if (!contacted) {
      alert('Please contact the owner first before proceeding to payment.');
      return;
    }
    router.push({
      pathname: '/customer/subscribe/[subscription_id]/payment',
      params: { subscription_id }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Owner / ಮಾಲಿಕರನ್ನು ಸಂಪರ್ಕಿಸಿ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Important Note */}
        <View style={styles.noteCard}>
          <AlertCircle size={26} color="#F59E0B" />
          <View style={styles.noteText}>
            <Text style={styles.noteTitle}>Important Note / ಮುಖ್ಯ</Text>
            <Text style={styles.noteSubtitle}>
              Please contact the owner to confirm delivery details before proceeding with payment.
            </Text>
            <Text style={styles.noteSubtitleKannada}>
              ಪಾವತಿ ಮಾಡುವ ಮೊದಲು ಡೆಲಿವರಿ ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಲು ಮಾಲಿಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.
            </Text>
          </View>
        </View>

        {/* Newspaper Details */}
        <View style={styles.paperCard}>
          <PaperLogo id={paper.id} name={paper.name} imageSrc={paper.imageSrc} size={80} />
          <View style={styles.paperText}>
            <Text style={styles.paperTitle}>{paper.name}</Text>
            <Text style={styles.paperSubtitle}>{getLanguageDisplay(paper.language)} • {paper.category}</Text>
          </View>
        </View>

        {/* Owner Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Owner Contact Details / ಮಾಲಿಕರ ಸಂಪರ್ಕ ವಿವರಗಳು</Text>
          <Text style={styles.contactSubtitle}>Contact the owner to confirm delivery / ಡೆಲಿವರಿ ಖಚಿತಪಡಿಸಲು ಮಾಲಿಕರನ್ನು ಸಂಪರ್ಕಿಸಿ:</Text>

          <TouchableOpacity style={styles.contactItem} onPress={handleCallOwner}>
            <View style={styles.iconContainer}>
              <Phone size={22} color="#2563EB" />
            </View>
            <View style={styles.contactItemText}>
              <Text style={styles.contactItemLabel}>Phone</Text>
              <Text style={styles.contactItemValue}>{ownerContact.phone}</Text>
            </View>
            <Text style={styles.contactAction}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleMessageOwner}>
            <View style={styles.iconContainer}>
              <Image 
                source={{ uri: 'https://raw.githubusercontent.com/WalkxCode/dashboard-icons/main/png/whatsapp.png' }}
                style={styles.whatsappLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.contactItemText}>
              <Text style={styles.contactItemLabel}>WhatsApp</Text>
              <Text style={styles.contactItemValue}>Message Owner</Text>
            </View>
            <Text style={styles.whatsappAction}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Confirmation */}
        <View style={styles.confirmCard}>
          <TouchableOpacity 
            style={[styles.confirmButton, contacted ? styles.confirmButtonActive : styles.confirmButtonInactive]}
            onPress={() => setContacted(!contacted)}
          >
            <CheckCircle size={20} color={contacted ? "#FFFFFF" : "#94A3B8"} />
            <Text style={[styles.confirmButtonText, contacted && styles.confirmButtonTextActive]}>
              {contacted ? 'I have contacted the owner / ನಾನು ಮಾಲಿಕರನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದೇನೆ' : 'Mark as contacted / ಸಂಪರ್ಕಿಸಿದ್ದೇನೆ ಎಂದು ಗುರುತಿಸಿ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Proceed Button */}
        <TouchableOpacity 
          style={[styles.proceedButton, !contacted && styles.proceedButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={!contacted}
        >
          <Text style={styles.proceedButtonText}>Proceed to Payment (₹{SUBSCRIPTION_FEE})</Text>
        </TouchableOpacity>

        <Text style={styles.hintText}>
          You must contact the owner before proceeding to payment / ಪಾವತಿಗೆ ಮುಂಚೆ ಮಾಲಿಕರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  noteCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 3,
  },
  noteSubtitle: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  noteSubtitleKannada: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    marginTop: 2,
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
    marginBottom: 2,
  },
  paperSubtitle: {
    fontSize: 13,
    color: '#64748B',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  whatsappLogo: {
    width: 36,
    height: 36,
  },
  whatsappAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25D366',
  },
  confirmCard: {
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  confirmButtonActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  confirmButtonInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
  },
  confirmButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  proceedButton: {
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
  proceedButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});