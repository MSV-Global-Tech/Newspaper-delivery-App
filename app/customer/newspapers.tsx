import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, StyleSheet, Image,
} from 'react-native';
import { ArrowLeft, Search, Star, BookOpen, Newspaper } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { IMAGES } from '../../assets/images';
import { store } from '../../utils/store';

const CATEGORIES = ['All', 'Paper', 'Magazine'] as const;

export default function NewspapersScreen() {
  const params = useLocalSearchParams<{ lang?: string }>();
  const [activeLanguage, setActiveLanguage] = useState<string>(params.lang || 'All');
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('All');
  const [search, setSearch] = useState('');
  const [papers, setPapers] = useState(store.getPapers());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());
  const [user, setUser] = useState(store.getUser());

  useEffect(() => {
    if (params.lang && params.lang !== activeLanguage) {
      setActiveLanguage(params.lang);
    }
  }, [params.lang]);

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
      (activeCategory === 'All' || n.category === activeCategory) &&
      n.name.toLowerCase().includes(search.toLowerCase())
  );

  const requireAuth = (callback: () => void) => {
    if (!user) {
      router.push('/customer/login');
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Publications</Text>
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 }}>
            {papers.filter(p => p.category === 'Paper').length} Papers • {papers.filter(p => p.category === 'Magazine').length} Magazines
          </Text>
        </View>
      </View>

      <View style={styles.searchPad}>
        <View style={styles.searchBox}>
          <Search size={17} color="#94A3B8" />
          <TextInput
            placeholder="Search newspapers & magazines..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Category Filter */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={styles.catRow}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.catChip, isActive && styles.catChipActive]}
                activeOpacity={0.8}
              >
                {cat !== 'All' && (cat === 'Paper'
                  ? <Newspaper size={13} color={isActive ? '#FFFFFF' : '#64748B'} />
                  : <BookOpen size={13} color={isActive ? '#FFFFFF' : '#9333EA'} />
                )}
                <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                  {cat === 'All' ? 'All' : cat === 'Paper' ? 'Papers' : 'Magazines'}
                </Text>
              </TouchableOpacity>
            );
          })}
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
        {/* If All category, split by sections */}
        {activeCategory === 'All' ? (
          (['Paper', 'Magazine'] as const).map((cat) => {
            const catItems = filtered.filter(p => p.category === cat);
            if (catItems.length === 0) return null;
            return (
              <View key={cat} style={{ marginBottom: 20 }}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: cat === 'Paper' ? '#2563EB' : '#9333EA' }]} />
                  <Text style={styles.sectionTitle}>{cat === 'Paper' ? '📰 NEWSPAPERS' : '📚 MAGAZINES'}</Text>
                  <Text style={styles.sectionCount}>{catItems.length}</Text>
                </View>

                {catItems.map((item) => (
                  <PaperCard key={item.id} item={item} deliveries={deliveries} requireAuth={requireAuth} />
                ))}
              </View>
            );
          })
        ) : (
          filtered.map((item) => (
            <PaperCard key={item.id} item={item} deliveries={deliveries} requireAuth={requireAuth} />
          ))
        )}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '600' }}>No publications found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PaperCard({ item, deliveries, requireAuth }: any) {
  const isSubscribed = deliveries.some((d: any) => d.paperName === item.name);
  return (
    <TouchableOpacity
      style={styles.paperCard}
      activeOpacity={0.8}
      onPress={() => requireAuth(() => router.push(`/customer/newspaper/${item.id}` as any))}
    >
      <View style={[
        styles.logoTile,
        { backgroundColor: item.category === 'Paper' ? '#F8FAFC' : '#FAF5FF' },
      ]}>
        <Image source={item.src} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </View>

      <View style={{ flex: 1, marginLeft: 16, height: 110, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.paperName}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6, flexWrap: 'wrap' }}>
              <Text style={[
                styles.langBadge,
                { backgroundColor: item.category === 'Paper' ? '#EFF6FF' : '#FAF5FF', color: item.category === 'Paper' ? '#2563EB' : '#9333EA' }
              ]}>
                {item.language}
              </Text>
              <Text style={styles.paperLang}>• {item.category}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{item.rating}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            {item.priceDay > 0 && <Text style={styles.priceText}>₹{item.priceDay} / day</Text>}
            <Text style={styles.priceText}>₹{item.priceMonth} / month</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.subBtn,
              isSubscribed && { backgroundColor: '#16A34A' }
            ]}
            onPress={() => !isSubscribed && requireAuth(() => router.push(`/customer/subscribe/${item.id}` as any))}
            activeOpacity={isSubscribed ? 1 : 0.85}
          >
            <Text style={styles.subBtnText}>
              {isSubscribed ? 'Active' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
  catRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
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
    width: 108,
    height: 118,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  paperLang: { fontSize: 12, color: '#64748B', marginTop: 1 },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionDot: {
    width: 6,
    height: 22,
    borderRadius: 3,
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priceText: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 },
  subBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8,
  },
  subBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
