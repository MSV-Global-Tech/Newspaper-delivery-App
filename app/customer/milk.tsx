import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolvePaperImage } from '../../assets/images';
import { store } from '../../utils/store';
import { placeOrder } from '../../database';

const MILK_ITEMS = [
  { id: 'milk_0_5', title: 'Milk 500 ml', subtitle: '500 ml packet', type: 'Milk', price: 28, imageSrc: 'milk.webp' },
  { id: 'milk_1', title: 'Milk 1 Liter', subtitle: '1L packet', type: 'Milk', price: 54, imageSrc: 'milk.webp' },
];

export default function MilkScreen() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const user = store.getUser();

  const handleOpenBuy = (item: any) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to place an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/customer/login') }
        ]
      );
      return;
    }
    setSelectedItem(item);
    setQuantity(1);
    setAddress(user.address || '');
  };

  const handleConfirmOrder = async () => {
    if (!selectedItem || !user) return;
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    setIsPlacing(true);
    try {
      const orderData = {
        customerName: user.name,
        customerPhone: user.phone,
        customerAddress: address,
        category: 'Milk' as const,
        itemId: selectedItem.id,
        itemTitle: selectedItem.title,
        quantity: quantity,
        pricePerUnit: selectedItem.price,
        totalPrice: selectedItem.price * quantity,
        status: 'Pending' as const,
      };

      await placeOrder(orderData);
      
      setSelectedItem(null);
      Alert.alert(
        'Success 🎉',
        `Your order for ${quantity}x ${selectedItem.title} has been placed successfully!\nTotal: ₹${orderData.totalPrice}`,
        [{ text: 'OK', onPress: () => router.push('/customer/bottom_nav/home') }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
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
          <Text style={styles.headerTitle}>Milk</Text>
          <Text style={styles.headerSub}>Daily milk delivery</Text>
        </View>
      </View>

      <FlatList
        data={MILK_ITEMS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        columnWrapperStyle={styles.columnWrap}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Select Milk Packet</Text>}
        renderItem={({ item }) => <MilkItemTile item={item} onPressBuy={() => handleOpenBuy(item)} />}
      />

      {/* Buy Modal */}
      {selectedItem && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedItem(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Confirm Order</Text>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                    <Text style={{ fontSize: 20, color: '#64748B', fontWeight: 'bold' }}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* Product Summary */}
                <View style={styles.modalProductCard}>
                  <Image source={resolvePaperImage(selectedItem.imageSrc)} style={styles.modalProductImage} resizeMode="contain" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.modalProductTitle}>{selectedItem.title}</Text>
                    <Text style={styles.modalProductSub}>{selectedItem.subtitle}</Text>
                    <Text style={styles.modalProductPrice}>₹{selectedItem.price} / packet</Text>
                  </View>
                </View>

                {/* Quantity Selector */}
                <Text style={styles.formLabel}>Quantity</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                    onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} color={quantity <= 1 ? '#CBD5E1' : '#0F172A'} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={18} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* Address Input */}
                <Text style={styles.formLabel}>Delivery Address</Text>
                <TextInput
                  style={styles.addressInput}
                  multiline
                  numberOfLines={3}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter complete delivery address"
                  placeholderTextColor="#94A3B8"
                />

                {/* Total Summary */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalPrice}>₹{selectedItem.price * quantity}</Text>
                </View>

                {/* Place Order Button */}
                <TouchableOpacity
                  style={[styles.orderBtn, isPlacing && styles.orderBtnDisabled]}
                  onPress={handleConfirmOrder}
                  disabled={isPlacing}
                  activeOpacity={0.8}
                >
                  {isPlacing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.orderBtnText}>Place Order (Pay on Delivery)</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function MilkItemTile({ item, onPressBuy }: any) {
  const src = item.imageSrc ? resolvePaperImage(item.imageSrc) : null;
  const displayPrice = typeof item.price === 'number' ? `₹${item.price}` : '₹—';

  return (
    <View style={styles.tileCard}>
      <View style={styles.tileImage}>
        {src ? (
          <Image source={src} style={styles.tileImageInner} resizeMode="contain" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>M</Text>
          </View>
        )}
      </View>

      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.itemSub} numberOfLines={1}>{item.subtitle}</Text>
      <Text style={styles.priceText}>{displayPrice}</Text>

      <TouchableOpacity
        style={styles.buyBtnFull}
        onPress={onPressBuy}
        activeOpacity={0.85}
      >
        <Text style={styles.buyBtnText}>Buy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  body: {
    padding: 16,
    paddingBottom: 28,
  },
  columnWrap: {
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
  },
  tileCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  tileImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tileImageInner: {
    width: '90%',
    height: '90%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: -1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  priceText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 8,
  },
  buyBtnFull: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  modalProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalProductImage: {
    width: 60,
    height: 60,
  },
  modalProductTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalProductSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalProductPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 4,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 20,
  },
  addressInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  orderBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  orderBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
