import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, StyleSheet, Image,
} from 'react-native';
import { ArrowLeft, Search, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { IMAGES } from '../assets/images';
import { store } from '../utils/store';

const LANGUAGES = ['All', 'Kannada', 'English', 'Tamil', 'Hindi'];

// Languages extracted dynamically based on available papers, plus 'All'
// const LANGUAGES = ['All', 'Kannada', 'English', 'Tamil', 'Hindi'];

export default function NewspapersScreen() {
  const [activeLanguage, setActiveLanguage] = useState('All');
  const [search, setSearch] = useState('');
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

  const LANGUAGES = ['All', ...Array.from(new Set(papers.map(p => p.language)))];

  const filtered = papers.filter(
    (n) =>
      (activeLanguage === 'All' || n.language === activeLanguage) &&
      n.name.toLowerCase().includes(search.toLowerCase())
  );

  const requireAuth = (callback: () => void) => {
    if (!user) {
      router.push('/login');
    } else {
      callback();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Newspapers</Text>
      </View>

      <View style={styles.searchPad}>
        <View style={styles.searchBox}>
          <Search size={17} color="#94A3B8" />
          <TextInput
            placeholder="Search newspapers..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={{ paddingBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setActiveLanguage(lang)}
              style={[styles.chip, activeLanguage === lang && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeLanguage === lang && styles.chipTextActive]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.paperCard}
            activeOpacity={0.8}
            onPress={() => requireAuth(() => router.push(`/newspaper/${item.id}` as any))}
          >
            {/* Logo area */}
            <View style={styles.logoTile}>
              <Image source={item.src} style={{ width: 64, height: 64 }} resizeMode="contain" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.paperName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.paperLang}>{item.language}</Text>
              <Text style={styles.paperPrice}>₹{item.priceDay}/day  •  ₹{item.priceMonth}/mo</Text>
            </View>

            {(() => {
              const isSubscribed = deliveries.some(d => d.paperName === item.name);
              return (
                <TouchableOpacity
                  style={[
                    styles.subBtn, 
                    isSubscribed && { backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }
                  ]}
                  onPress={() => !isSubscribed && requireAuth(() => router.push(`/subscribe/${item.id}` as any))}
                  activeOpacity={isSubscribed ? 1 : 0.85}
                >
                  <Text style={[styles.subBtnText, isSubscribed && { fontSize: 10 }]}>
                    {isSubscribed ? 'Active' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  searchPad: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#0F172A', fontWeight: '500' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },
  paperCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  logoTile: {
    width: 76, height: 76, backgroundColor: '#F8FAFC',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  paperName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  paperLang: { fontSize: 12, color: '#64748B', marginTop: 1 },
  paperPrice: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '500' },
  subBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 13,
    paddingVertical: 8, borderRadius: 10, marginLeft: 8,
  },
  subBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
