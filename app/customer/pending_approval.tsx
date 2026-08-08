import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { store } from '../../utils/store';
import { fetchUser } from '../../database';

export default function PendingApprovalScreen() {
  const [checking, setChecking] = useState(false);
  const user = store.getUser();

  const handleRefresh = async () => {
    if (!user?.phone) return;
    setChecking(true);
    try {
      const latest: any = await fetchUser(user.phone);
      if (latest && latest.approvalStatus === 'approved') {
        store.setUser({
          name: latest.name,
          phone: latest.phone,
          address: latest.address,
          isAdmin: user.isAdmin,
          customerKind: latest.customerKind ?? 'legacy',
          approvalStatus: latest.approvalStatus ?? 'approved',
        } as any);
        router.replace('/customer/bottom_nav/home');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>Pending Approval</Text>
          <Text style={styles.sub}>
            Your account is waiting for admin approval. Once approved, you can continue using the app.
          </Text>

          {user?.phone ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Phone</Text>
              <Text style={styles.infoVal}>{user.phone}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, checking && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleRefresh}
            disabled={checking}
          >
            <Text style={styles.primaryText}>{checking ? 'Checking…' : 'Refresh Status'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              store.setUser(null);
              router.replace('/customer/login');
            }}
          >
            <Text style={styles.secondaryText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  sub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 18,
  },
  infoRow: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
});

