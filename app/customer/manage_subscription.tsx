import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Alert, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ArrowLeft, PauseCircle, SkipForward, PlayCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { store, Delivery } from '../../utils/store';

export default function ManageSubscriptionScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
    });
    return unsubscribe;
  }, []);

  const customerDeliveries = deliveries.filter((d) => d.name === user?.name && d.plan !== 'One-time');

  if (customerDeliveries.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Subscriptions</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center' }}>
            You do not have any active subscriptions to manage.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSkipTomorrow = (delivery: Delivery) => {
    Alert.alert(
      'Skip Tomorrow',
      `Are you sure you want to skip tomorrow's delivery for ${delivery.paperName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Skip', 
          style: 'destructive', 
          onPress: () => {
            store.updateDeliveryStatus(delivery.id, 'Skipped');
            alert(`Delivery for ${delivery.paperName} tomorrow has been skipped.`);
          }
        }
      ]
    );
  };

  const handlePause = (delivery: Delivery) => {
    Alert.alert(
      'Pause Subscription',
      `Are you sure you want to pause your ${delivery.paperName} subscription until further notice?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Pause', 
          style: 'destructive', 
          onPress: () => {
            store.updateDeliveryStatus(delivery.id, 'Skipped');
            alert(`${delivery.paperName} subscription paused successfully.`);
          }
        }
      ]
    );
  };

  const handleResume = (delivery: Delivery) => {
    store.updateDeliveryStatus(delivery.id, 'Pending');
    alert(`${delivery.paperName} subscription resumed successfully!`);
  };

  const contactAgent = () => {
    Linking.openURL('tel:9972505709');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Subscriptions</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Active Plans ({customerDeliveries.length})</Text>
        
        {customerDeliveries.map((delivery) => {
          const isSkipped = delivery.status === 'Skipped';
          
          return (
            <View key={delivery.id} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={delivery.src} style={{ width: 60, height: 60 }} resizeMode="contain" />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{delivery.paperName}</Text>
                  <Text style={{ fontSize: 13, color: isSkipped ? '#EA580C' : '#16A34A', marginTop: 4, fontWeight: '600' }}>
                    {isSkipped ? 'Currently Paused/Skipped' : 'Active Subscription'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                {isSkipped ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#16A34A', flex: 1 }]} 
                    onPress={() => handleResume(delivery)}
                    activeOpacity={0.8}
                  >
                    <PlayCircle size={16} color="#FFFFFF" />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Resume Delivery</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#EEF2FF', flex: 1 }]} 
                      onPress={() => handleSkipTomorrow(delivery)}
                      activeOpacity={0.8}
                    >
                      <SkipForward size={16} color="#2563EB" />
                      <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Skip Tomorrow</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#FFF7ED', flex: 1 }]} 
                      onPress={() => handlePause(delivery)}
                      activeOpacity={0.8}
                    >
                      <PauseCircle size={16} color="#EA580C" />
                      <Text style={[styles.actionBtnText, { color: '#EA580C' }]}>Pause Plan</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
        
        {/* Contact Agent Button */}
        <TouchableOpacity style={styles.contactBtn} onPress={contactAgent} activeOpacity={0.8}>
          <FontAwesome name="phone" size={18} color="#2563EB" />
          <Text style={styles.contactBtnText}>Contact Agent (Akhil K S)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#64748B', marginBottom: 12, marginLeft: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13, fontWeight: '700'
  },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EEF2FF', paddingVertical: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E7FF', marginTop: 12,
  },
  contactBtnText: {
    fontSize: 15, fontWeight: '700', color: '#2563EB'
  }
});
