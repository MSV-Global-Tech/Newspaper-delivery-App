import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import PaperLogo from '../../../components/PaperLogo';
import { store } from '../../../utils/store';
import { IMAGES } from '../../../assets/images';

const SUBSCRIPTION_FEE = 50; // Fixed 50 Rs

export default function SubscribeScreen() {
  const { subscription_id } = useLocalSearchParams<{ subscription_id: string }>();
  const [papers, setPapers] = useState(store.getPapers());

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

  const handleSubscribe = () => {
    // Navigate to contact screen first
    router.push({
      pathname: '/customer/subscribe/[subscription_id]/contact',
      params: { subscription_id }
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Subscribe</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Important Note */}
        <View style={s.noteCard}>
          <AlertCircle size={26} color="#F59E0B" />
          <View style={s.noteText}>
            <Text style={s.noteTitle}>Important / ಮುಖ್ಯ</Text>
            <Text style={s.noteSubtitle}>
              You will need to contact the owner before making payment. This ensures proper delivery arrangement.
            </Text>
            <Text style={s.noteSubtitleKannada}>
              ಪಾವತಿ ಮಾಡುವ ಮೊದಲು ಮಾಲಿಕರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು. ಇದು ಸರಿಯಾದ ಡೆಲಿವರಿ ವ್ಯವಸ್ಥೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ.
            </Text>
          </View>
        </View>

        {/* Newspaper Details */}
        <View style={s.paperCard}>
          <PaperLogo id={paper.id} name={paper.name} imageSrc={paper.imageSrc} size={100} />
          <View style={s.paperText}>
            <Text style={s.paperTitle}>{paper.name}</Text>
            <Text style={s.paperSubtitle}>{getLanguageDisplay(paper.language)} • {paper.category}</Text>
          </View>
        </View>

        {/* Subscription Info */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>Subscription Details</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Subscription Fee</Text>
            <Text style={s.infoValue}>₹{SUBSCRIPTION_FEE}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Payment Type</Text>
            <Text style={s.infoValue}>One-time</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Delivery</Text>
            <Text style={s.infoValue}>Daily</Text>
          </View>
        </View>

        {/* Process Steps */}
        <View style={s.stepsCard}>
          <Text style={s.stepsTitle}>How It Works</Text>
          <View style={s.stepItem}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>1</Text>
            </View>
            <View style={s.stepText}>
              <Text style={s.stepTitle}>Contact Owner</Text>
              <Text style={s.stepSubtitle}>Call or message the owner to confirm delivery</Text>
            </View>
          </View>
          <View style={s.stepItem}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>2</Text>
            </View>
            <View style={s.stepText}>
              <Text style={s.stepTitle}>Pay ₹{SUBSCRIPTION_FEE}</Text>
              <Text style={s.stepSubtitle}>Make payment via Razorpay</Text>
            </View>
          </View>
          <View style={s.stepItem}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>3</Text>
            </View>
            <View style={s.stepText}>
              <Text style={s.stepTitle}>Start Delivery</Text>
              <Text style={s.stepSubtitle}>Owner will start delivering newspaper</Text>
            </View>
          </View>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity style={s.subscribeButton} onPress={handleSubscribe}>
          <Text style={s.subscribeButtonText}>Contact Owner & Subscribe</Text>
        </TouchableOpacity>

        <Text style={s.secureText}>
          🔒 Secure payment via Razorpay
        </Text>
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
    marginBottom: 3,
  },
  paperSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  subscribeButton: {
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
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secureText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});