import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, StyleSheet, Linking, Alert,
} from 'react-native';
import { ArrowLeft, Phone, MapPin, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { store } from '../../utils/store';
import type { AgentDoc } from '../../utils/store';

export default function AgentsScreen() {
  const [user, setUser] = useState(store.getUser());
  const [agents, setAgents] = useState<AgentDoc[]>(store.getAgents());

  useEffect(() => {
    const u = store.getUser();
    const admins = store.getAdminNumbers();
    const isAdmin = u ? admins.some(a => a.phone === u.phone) : false;
    if (!u || !isAdmin) {
      router.replace('/customer/bottom_nav/home' as any);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setAgents(store.getAgents());
    });
    return unsubscribe;
  }, []);

  const isAdmin = user?.isAdmin || (user ? store.getAdminNumbers().some(a => a.phone === user.phone) : false);

  const handleCall = (phone: string, name: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Call', `${name}: ${phone}`);
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Delivery Agents</Text>
          <Text style={styles.headerSub}>Your neighbourhood paper-boys in Bengaluru</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {!isAdmin ? null : agents.length === 0 ? (
          <View style={styles.emptyBox}>
            <User size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No agents listed yet.</Text>
          </View>
        ) : (
          agents.map((agent) => (
            <View key={agent.id} style={styles.card}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <View style={[styles.statusPill, { backgroundColor: agent.isActive ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: agent.isActive ? '#166534' : '#991B1B' }]}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={12} color="#64748B" />
                  <Text style={styles.infoText}>{agent.area}</Text>
                </View>

                {agent.location ? (
                  <View style={styles.infoRow}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={[styles.infoText, { color: '#94A3B8' }]}>{agent.location}</Text>
                  </View>
                ) : null}

                {/* Call button */}
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(agent.phone, agent.name)}
                  activeOpacity={0.8}
                >
                  <Phone size={13} color="#2563EB" />
                  <Text style={styles.callBtnText}>{agent.phone}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 1 },

  emptyBox: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12,
  },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#2563EB' },

  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  agentName: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 8 },

  statusPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3,
  },
  infoText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  callBtn: {
    marginTop: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
});
