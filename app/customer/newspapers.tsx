import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, StyleSheet, Image,
} from 'react-native';
import { ArrowLeft, Search, BookOpen, Newspaper } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
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

  const categoryScrollRef = useRef<any>(null);
  const languageScrollRef = useRef<any>(null);
  const categoryChipX = useRef<Record<string, number>>({});
  const languageChipX = useRef<Record<string, number>>({});

  const scrollToCategory = (cat: string) => {
    const x = categoryChipX.current[cat];
    if (typeof x === 'number') {
      categoryScrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
    }
  };

  const scrollToLanguage = (lang: string) => {
    const x = languageChipX.current[lang];
    if (typeof x === 'number') {
      languageScrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
    }
  };

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

  const papersForLanguage =
    activeCategory === 'All' ? papers : papers.filter((p) => p.category === activeCategory);
  const LANGUAGES = ['All', ...Array.from(new Set(papersForLanguage.map((p) => p.language)))];

  useEffect(() => {
    if (activeLanguage !== 'All' && !LANGUAGES.includes(activeLanguage)) {
      setActiveLanguage('All');
    }
  }, [activeCategory, papers]);

  useEffect(() => {
    scrollToCategory(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    scrollToLanguage(activeLanguage);
  }, [activeLanguage, activeCategory, papers.length]);

  const filtered = papers.filter(
    (n) =>
      (activeLanguage === 'All' || n.language === activeLanguage) &&
      (activeCategory === 'All' || n.category === activeCategory) &&
      n.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (activeLanguage === 'All') {
      const ak = a.language === 'Kannada' ? 0 : 1;
      const bk = b.language === 'Kannada' ? 0 : 1;
      if (ak !== bk) return ak - bk;
      const ac = a.category === 'Paper' ? 0 : 1;
      const bc = b.category === 'Paper' ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.name.localeCompare(b.name);
    }
    const ac2 = a.category === 'Paper' ? 0 : 1;
    const bc2 = b.category === 'Paper' ? 0 : 1;
    if (ac2 !== bc2) return ac2 - bc2;
    return a.name.localeCompare(b.name);
  });

  const shownPapersCount = filtered.filter((p) => p.category === 'Paper').length;
  const shownMagazinesCount = filtered.filter((p) => p.category === 'Magazine').length;

  const languageLabel = activeLanguage === 'All' ? 'All languages' : activeLanguage;
  const headerSubtitle =
    activeCategory === 'Paper'
      ? `${languageLabel} • ${shownPapersCount} Papers`
      : activeCategory === 'Magazine'
        ? `${languageLabel} • ${shownMagazinesCount} Magazines`
        : `${languageLabel} • ${shownPapersCount} Papers • ${shownMagazinesCount} Magazines`;

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
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/customer/bottom_nav/home')} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Publications</Text>
          <Text style={styles.headerSubtitle}>
            {headerSubtitle}
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
      <View style={{ paddingBottom: 10 }}>
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          onContentSizeChange={() => scrollToCategory(activeCategory)}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.catChip, isActive && styles.catChipActive]}
                activeOpacity={0.8}
                onLayout={(e) => { categoryChipX.current[cat] = e.nativeEvent.layout.x; }}
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
        </ScrollView>
      </View>

      <View style={{ paddingBottom: 10 }}>
        <ScrollView
          ref={languageScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          onContentSizeChange={() => scrollToLanguage(activeLanguage)}
        >
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setActiveLanguage(lang)}
              style={[styles.chip, activeLanguage === lang && styles.chipActive]}
              activeOpacity={0.8}
              onLayout={(e) => { languageChipX.current[lang] = e.nativeEvent.layout.x; }}
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
                  <PaperCard key={item.id} item={item} deliveries={deliveries} user={user} requireAuth={requireAuth} />
                ))}
              </View>
            );
          })
        ) : (
          filtered.map((item) => (
            <PaperCard key={item.id} item={item} deliveries={deliveries} user={user} requireAuth={requireAuth} />
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

function PaperCard({ item, deliveries, user, requireAuth }: any) {
  const isSubscribed = user ? deliveries.some((d: any) => d.paperName === item.name && d.name === user.name) : false;
  return (
    <TouchableOpacity
      style={styles.paperCard}
      activeOpacity={0.8}
      onPress={() => requireAuth(() => router.push(`/customer/newspaper/${item.id}` as any))}
    >
      <View style={[
        styles.logoTile,
      ]}>
        <Image source={item.src} style={{ width: '100%', height: '100%', borderRadius: 13 }} resizeMode="cover" />
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
  headerSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 },
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
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 0,
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
    backgroundColor: '#2563EB', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 7,
  },
  subBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
