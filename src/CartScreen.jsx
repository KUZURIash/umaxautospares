import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  Keyboard
} from "react-native";

import { useFocusEffect } from '@react-navigation/native';
import { useCart } from "./CartContext";
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 

import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ChevronLeftIcon,
  ShoppingBagIcon
} from "react-native-heroicons/outline";

const { width } = Dimensions.get('window');

const formatPrice = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

/* --- SUB-COMPONENT FOR CART ITEM --- */
const CartItem = ({ item, handleUpdate, removeFromCart, loadingId }) => {
  const minQty = item.product?.minOrderQuantity || 1;
  // Local state allows smooth typing without immediate API calls
  const [localQty, setLocalQty] = useState(String(item.quantity));

  // Sync local state if quantity changes via Plus/Minus buttons or API refresh
  useEffect(() => {
    setLocalQty(String(item.quantity));
  }, [item.quantity]);

  const onManualChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setLocalQty(cleaned);
  };

  const onFinalizeUpdate = () => {
    const parsed = parseInt(localQty);
    // If empty or less than MOQ, snap back to minQty
    if (localQty === "" || isNaN(parsed) || parsed < minQty) {
      setLocalQty(String(minQty));
      handleUpdate(item.productId, minQty);
    } else if (parsed !== item.quantity) {
      handleUpdate(item.productId, parsed);
    }
  };

  return (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.product?.mainImage || "https://via.placeholder.com/150" }}
        style={styles.productImg}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.product?.name}
        </Text>
        <Text style={styles.moqText}>
          Min Qty: {minQty}
        </Text>

        <View style={styles.actionRow}>
          <Text style={styles.priceText}>{formatPrice(item.snapshotPrice)}</Text>
          <View style={styles.qtyContainer}>
            {loadingId === item.productId ? (
              <View style={{ width: horizontalScale(100), alignItems: 'center' }}>
                 <ActivityIndicator size="small" color="#1e3a8a" />
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => handleUpdate(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= minQty}
                >
                  <MinusIcon size={moderateScale(14)} color={item.quantity <= minQty ? "#cbd5e1" : "#0f172a"} />
                </TouchableOpacity>

                {/* MANUAL QUANTITY INPUT */}
                <TextInput
                  style={styles.qtyInput}
                  value={localQty}
                  onChangeText={onManualChange}
                  onBlur={onFinalizeUpdate}
                  onSubmitEditing={onFinalizeUpdate}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={5}
                />

                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => handleUpdate(item.productId, item.quantity + 1)}
                >
                  <PlusIcon size={moderateScale(14)} color="#0f172a" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromCart(item.productId)}>
        <TrashIcon size={moderateScale(20)} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};

/* --- MAIN CART SCREEN --- */
export default function CartScreen({ navigation }) {
  const { cartItems, cartData, updateQuantity, removeFromCart, applyCoupon, fetchCart, loading } = useCart();
  const [coupon, setCoupon] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const handleUpdate = async (id, qty) => {
    const item = cartItems.find(i => i.productId === id);
    const minQty = item?.product?.minOrderQuantity || 1;
    if (qty < minQty) return;

    setLoadingId(id);
    await updateQuantity(id, qty);
    setLoadingId(null);
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <SafeScreenWrapper backgroundColor="#F8FAFC">
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyIconBox}>
            <ShoppingBagIcon size={moderateScale(60)} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeScreenWrapper>
    );
  }

  return (
    <SafeScreenWrapper backgroundColor="#F1F5F9">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={moderateScale(24)} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.productId || Math.random().toString()}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchCart} colors={['#1e3a8a']} tintColor={'#1e3a8a'} />
        }
        renderItem={({ item }) => (
          <CartItem 
            item={item} 
            handleUpdate={handleUpdate} 
            removeFromCart={removeFromCart} 
            loadingId={loadingId} 
          />
        )}
        ListFooterComponent={
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {cartItems.map((item, index) => (
              <View key={item.productId || index} style={styles.productSummary}>
                <View style={styles.productSummaryHeader}>
                  <Text style={styles.summaryProductName} numberOfLines={1}>{item.product?.name}</Text>
                  <Text style={styles.summaryProductPrice}>{formatPrice(item.snapshotPrice * item.quantity)}</Text>
                </View>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>{formatPrice(cartData.subtotal)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.label}>Shipping</Text><Text style={styles.value}>{formatPrice(cartData.shippingCost)}</Text></View>

            {cartData.couponDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.label, {color: '#10b981'}]}>Discount</Text>
                <Text style={[styles.value, {color: '#10b981'}]}>-{formatPrice(cartData.couponDiscount)}</Text>
              </View>
            )}

            <View style={[styles.summaryRow, { marginTop: verticalScale(8) }]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(cartData.total)}</Text>
            </View>

            <View style={styles.couponContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Coupon code"
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity style={styles.applyBtn} onPress={() => applyCoupon(coupon)}>
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate("CheckoutScreen")}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>

            <Text style={styles.taxText}>Taxes calculated at checkout.</Text>
          </View>
        }
      />
    </SafeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: horizontalScale(18), paddingVertical: verticalScale(18), backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerTitle: { fontSize: moderateScale(20), fontWeight: "800", marginLeft: horizontalScale(12), color: "#0f172a" },
  listPadding: { padding: horizontalScale(16), paddingBottom: verticalScale(30) },
  productCard: { flexDirection: "row", backgroundColor: "#fff", padding: horizontalScale(14), borderRadius: moderateScale(18), marginBottom: verticalScale(14), ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) },
  productImg: { width: horizontalScale(85), height: horizontalScale(85), borderRadius: moderateScale(14), backgroundColor: "#f1f5f9" },
  itemContent: { flex: 1, marginLeft: horizontalScale(14), justifyContent: "space-between" },
  itemName: { fontSize: moderateScale(15), fontWeight: "700", color: "#1e293b" },
  moqText: { fontSize: moderateScale(11), color: "#d97706", marginTop: verticalScale(4) },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: verticalScale(8) },
  priceText: { fontSize: moderateScale(17), fontWeight: "800", color: "#1e3a8a" },
  
  // QTY STYLES
  qtyContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: moderateScale(10), borderWidth: 1, borderColor: "#e2e8f0", minHeight: verticalScale(35), overflow: 'hidden' },
  qtyBtn: { paddingVertical: verticalScale(8), paddingHorizontal: horizontalScale(10) },
  qtyInput: { width: horizontalScale(45), textAlign: "center", fontWeight: "700", fontSize: moderateScale(15), color: '#0f172a', padding: 0, height: '100%' },
  
  deleteBtn: { justifyContent: "center", paddingLeft: horizontalScale(10) },
  summaryBox: { backgroundColor: "#fff", padding: horizontalScale(22), borderRadius: moderateScale(22), marginTop: verticalScale(15), ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } }) },
  summaryTitle: { fontSize: moderateScale(19), fontWeight: "800", marginBottom: verticalScale(18), color: '#0f172a' },
  productSummary: { marginBottom: verticalScale(14) },
  productSummaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryProductName: { fontSize: moderateScale(14), fontWeight: "600", color: "#334155", flex: 1, marginRight: horizontalScale(10) },
  summaryProductPrice: { fontSize: moderateScale(14), fontWeight: "700", color: "#0f172a" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: verticalScale(12) },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: verticalScale(8) },
  label: { fontSize: moderateScale(14), color: "#64748b" },
  value: { fontSize: moderateScale(15), fontWeight: "700", color: '#0f172a' },
  totalLabel: { fontSize: moderateScale(18), fontWeight: "800", color: '#0f172a' },
  totalValue: { fontSize: moderateScale(22), fontWeight: "900", color: "#1e3a8a" },
  couponContainer: { flexDirection: "row", marginTop: verticalScale(18) },
  couponInput: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: moderateScale(12), paddingHorizontal: horizontalScale(14), backgroundColor: "#f8fafc", height: verticalScale(48), color: '#0f172a' },
  applyBtn: { backgroundColor: "#0f172a", paddingHorizontal: horizontalScale(18), justifyContent: "center", borderRadius: moderateScale(12), marginLeft: horizontalScale(10) },
  applyText: { color: "#fff", fontWeight: "700", fontSize: moderateScale(14) },
  checkoutBtn: { backgroundColor: "#1e3a8a", paddingVertical: verticalScale(18), borderRadius: moderateScale(16), alignItems: "center", marginTop: verticalScale(18) },
  checkoutText: { color: "#fff", fontSize: moderateScale(16), fontWeight: "800" },
  taxText: { textAlign: "center", fontSize: moderateScale(12), color: "#64748b", marginTop: verticalScale(8),marginBottom: verticalScale(20) },
  emptyWrapper: { flex: 1, justifyContent: "center", alignItems: "center", padding: horizontalScale(20) },
  emptyIconBox: { width: horizontalScale(120), height: horizontalScale(120), borderRadius: horizontalScale(60), backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: verticalScale(20), elevation: 2 },
  emptyTitle: { fontSize: moderateScale(22), fontWeight: "800", color: "#1e293b" },
  emptySubtitle: { fontSize: moderateScale(14), color: "#64748b", marginTop: verticalScale(8), marginBottom: verticalScale(25), textAlign: 'center' },
  shopBtn: { backgroundColor: "#1e3a8a", paddingVertical: verticalScale(14), paddingHorizontal: horizontalScale(40), borderRadius: moderateScale(12) },
  shopBtnText: { color: "#fff", fontWeight: "700", fontSize: moderateScale(15) }
});