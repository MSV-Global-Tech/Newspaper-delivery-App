import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { store } from '../../../utils/store';
import PaperLogo from '../../../components/PaperLogo';

const TAG_BY_LANGUAGE: Record<string, string[]> = {
  'Kannada': ['Regional', 'Daily'],
  'English': ['National', 'Daily'],
  'Telugu': ['Regional', 'Daily'],
  'Tamil': ['Regional', 'Daily'],
  'Malayalam': ['Regional', 'Daily'],
  'Hindi': ['National', 'Daily'],
};

const DEFAULT_ABOUT: Record<string, string> = {
  Paper: 'A trusted daily newspaper delivering comprehensive news coverage, in-depth analysis, and up-to-date information from around the world.',
  Magazine: 'A premium magazine featuring curated stories, expert columns, special features, and engaging lifestyle content.',
};

export default function NewspaperDetailScreen() {
  const { newspaper_id } = useLocalSearchParams<{ newspaper_id: string }>();
  const [papers, setPapers] = useState(store.getPapers());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [user, setUser] = useState(store.getUser());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setPapers(store.getPapers());
      setDeliveries(store.getDeliveries());
      setUser(store.getUser());
    });
    return unsubscribe;
  }, []);

  const paper = papers.find(p => p.id === newspaper_id) || papers[0] || {
    id: '1',
    name: 'Publication',
    language: 'English',
    category: 'Paper' as const,
    priceDay: 0,
    priceMonth: 0,
    rating: 4.5,
    src: null,
  };

  const isSubscribed = user ? deliveries.some(d => d.paperName === paper.name && d.name === user.name) : false;
  const tags = TAG_BY_LANGUAGE[paper.language] || ['Local', 'Popular'];
  if (paper.category === 'Magazine') tags.unshift('Weekly / Monthly');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/customer/newspapers' as any);
            }
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Full Width Image Banner */}
        <View
          style={{
            width: '100%',
            height: 320,
            backgroundColor: paper.category === 'Paper' ? '#F8FAFC' : '#FAF5FF',
            overflow: 'hidden',
          }}
        >
          {paper.src ? (
            <Image
              source={paper.src}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <PaperLogo
                name={paper.name}
                id={newspaper_id as string}
                imageSrc={(paper as any).imageSrc ?? null}
                size={240}
              />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={styles.paperName}>{paper.name}</Text>
          <Text style={styles.paperSub}>{paper.language} {paper.category}</Text>

          {/* Tags */}
          <View style={styles.tagRow}>
            {tags.map((tag: string) => (
              <View
                key={tag}
                style={[
                  styles.tagPill,
                  { backgroundColor: paper.category === 'Paper' ? '#EFF6FF' : '#FAF5FF' }
                ]}
              >
                <Text style={[
                  styles.tagText,
                  { color: paper.category === 'Paper' ? '#2563EB' : '#9333EA' }
                ]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {DEFAULT_ABOUT[paper.category as string]} {paper.name} brings you the latest updates from {paper.language}-speaking communities.
          </Text>

          {/* Pricing Box */}
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {paper.priceDay > 0 && (
              <View style={styles.priceCard}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>₹{paper.priceDay}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' }}>Per Day</Text>
              </View>
            )}
            <View style={[styles.priceCard, paper.priceDay === 0 && { flex: 1 }]}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>₹{paper.priceMonth}</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' }}>Per Month</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Subscribe Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            isSubscribed && { backgroundColor: '#16A34A' },
            paper.category === 'Magazine' && !isSubscribed && { backgroundColor: '#9333EA' }
          ]}
          onPress={() => !isSubscribed && router.push(`/customer/subscribe/${newspaper_id}`)}
          activeOpacity={isSubscribed ? 1 : 0.85}
        >
          <Text style={styles.subscribeBtnText}>
            {isSubscribed ? 'Active' : `Subscribe to ${paper.name}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  paperName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  paperSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewsText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  tagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '500',
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subscribeBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
