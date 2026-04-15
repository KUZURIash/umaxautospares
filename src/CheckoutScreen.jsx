import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Modal, FlatList, Dimensions
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useCart } from './CartContext';
import api from './api';

// Scaling & Wrapper
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 

import {
  ChevronLeftIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChevronDownIcon
} from "react-native-heroicons/outline";

const { width } = Dimensions.get('window');
const RAZORPAY_KEY_ID = 'rzp_live_SIiJkM2kUz6Sqz';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal'
];

export default function CheckoutScreen({ navigation }) {
  const { cartItems, cartData, clearCart } = useCart(); 
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [stateModalVisible, setStateModalVisible] = useState(false);
  
  // Success State Logic
  const [isSuccess, setIsSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', state: '', pinCode: ''
  });

  useEffect(() => {
    const initCheckout = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res.data?.data?.user;
        if (userData) {
          setUser(userData);
          setForm(prev => ({
            ...prev,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
          }));
          if (userData.addresses) setAddresses(userData.addresses);
        }
      } catch (err) { console.log("Init error:", err) }
    };
    initCheckout();
  }, []);

  const totals = useMemo(() => {
    let totalTax = 0;
    cartItems.forEach(item => {
      const taxRate = item.product?.taxRate ?? 18;
      const itemSubtotal = item.subtotal || (item.snapshotPrice * item.quantity);
      totalTax += (itemSubtotal * taxRate) / 100;
    });
    const codFee = (paymentMethod === 'cod') ? Math.round(cartData.subtotal * 0.03) : 0;
    return {
      taxTotal: totalTax,
      codFee,
      finalTotal: (cartData.total || 0) + totalTax + codFee
    };
  }, [cartItems, paymentMethod, cartData]);

  const selectAddress = (addr) => {
    setForm(prev => ({
      ...prev,
      street: addr.street || '', city: addr.city || '',
      state: addr.state || '', pinCode: addr.postalCode || ''
    }));
  };

  const handleCheckout = async () => {
    if (!form.street || !form.pinCode || !form.state || !form.phone) {
      Alert.alert("Required", "Please fill in all shipping details.");
      return;
    }

    const shippingAddress = {
      firstName: form.firstName, lastName: form.lastName, email: form.email,
      phone: form.phone, street: form.street, city: form.city,
      state: form.state, postalCode: form.pinCode, country: 'India',
    };

    try {
      setLoading(true);
      let orderIdResult = null;

      if (paymentMethod === 'online') {
        const res = await api.post('/cart/initiate-payment', { shippingAddress });
        const responseData = res.data.data;

        const options = {
          description: 'Order Payment',
          image: 'https://res.cloudinary.com/del1zbnpx/image/upload/v1768975887/bike_parts/assets/umax_logo_v1.jpg',
          currency: responseData.currency || 'INR',
          key: RAZORPAY_KEY_ID,
          amount: responseData.amount, 
          name: 'Umax Auto Spares',
          order_id: responseData.razorpayOrderId,
          prefill: { email: form.email, contact: form.phone, name: `${form.firstName} ${form.lastName}` },
          theme: { color: '#1e3a8a' }
        };

        const successResponse = await RazorpayCheckout.open(options);
        const verifyRes = await api.post('/cart/verify-payment', {
          razorpayPaymentId: successResponse.razorpay_payment_id,
          razorpayOrderId: successResponse.razorpay_order_id,
          razorpaySignature: successResponse.razorpay_signature,
        });
        orderIdResult = verifyRes.data.data.order._id;
      } else {
        const idempotencyKey = `ord_${Date.now()}`;
        const response = await api.post('/orders', { shippingAddress, paymentMethod: 'COD' }, {
          headers: { 'Idempotency-Key': idempotencyKey }
        });
        const order = response.data?.data?.order || response.data?.order;
        orderIdResult = order?._id;
      }

      if (orderIdResult) {
        setPlacedOrderId(orderIdResult);
        if (clearCart) await clearCart();
        setIsSuccess(true); 
      }
    } catch (error) {
      if (error.code === 2) {
        Alert.alert("Payment Cancelled", "The process was stopped.");
      } else {
        Alert.alert("Error", error.response?.data?.message || error.message || "Checkout failed");
      }
    } finally { setLoading(false); }
  };

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <SafeScreenWrapper backgroundColor="#fff">
        <View style={styles.successContainer}>
          <View style={styles.successIconBadge}>
             <CheckCircleIcon size={moderateScale(80)} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>Thank you for your purchase. Your order details are listed below.</Text>
          
          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Payment Mode</Text>
              <Text style={styles.successValue}>{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Amount Paid</Text>
              <Text style={styles.successValue}>₹{Number(totals.finalTotal).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.replace('OrderDetail', { orderId: placedOrderId })}
          >
            <Text style={styles.primaryBtnText}>View Order Details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
           onPress={() => navigation.navigate('MainApp', { screen: 'Products' })}
          >
            <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeScreenWrapper>
    );
  }

  return (
    <SafeScreenWrapper backgroundColor="#F1F5F9">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={moderateScale(24)} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {addresses.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: verticalScale(10)}}>
                {addresses.map(addr => (
                  <TouchableOpacity key={addr._id} style={styles.addrCard} onPress={() => selectAddress(addr)}>
                    <Text style={styles.addrLabel}>{addr.label}</Text>
                    <Text numberOfLines={1} style={styles.addrText}>{addr.street}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <LabeledInput label="First Name" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
            <LabeledInput label="Last Name" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
            <LabeledInput label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
            <LabeledInput label="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={(v) => setForm({ ...form, phone: v })} />
            <LabeledInput label="Street Address" value={form.street} onChangeText={(v) => setForm({ ...form, street: v })} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
              </View>
              <View style={{ width: horizontalScale(15) }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>State</Text>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setStateModalVisible(true)}>
                  <Text style={[styles.dropdownText, !form.state && { color: '#94a3b8' }]}>
                    {form.state || "Select"}
                  </Text>
                  <ChevronDownIcon size={moderateScale(16)} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
            <LabeledInput label="PIN Code" keyboardType="numeric" value={form.pinCode} onChangeText={(v) => setForm({ ...form, pinCode: v })} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity style={[styles.payOption, paymentMethod === 'online' && styles.activePay]} onPress={() => setPaymentMethod('online')}>
              <View style={styles.payLeft}>
                <ShieldCheckIcon size={moderateScale(20)} color="#1e3a8a" />
                <Text style={styles.payText}>Pay Online</Text>
              </View>
              {paymentMethod === 'online' && <CheckCircleIcon size={moderateScale(22)} color="#1e3a8a" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'cod' && styles.activePay, user?.isCodBlocked && styles.disabledPay]}
              onPress={() => !user?.isCodBlocked && setPaymentMethod('cod')}
            >
              <View style={styles.payLeft}>
                <TruckIcon size={moderateScale(20)} color={user?.isCodBlocked ? "#94a3b8" : "#1e3a8a"} />
                <Text style={[styles.payText, user?.isCodBlocked && { color: "#94a3b8" }]}>Cash on Delivery</Text>
              </View>
              {paymentMethod === 'cod' && !user?.isCodBlocked && <CheckCircleIcon size={moderateScale(22)} color="#1e3a8a" />}
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {/* PRODUCT-WISE DETAILED VIEW */}
            {cartItems.map((item, index) => (
              <View key={item.productId || index} style={styles.productSummaryItem}>
                <View style={styles.productSummaryInfo}>
                  <Text style={styles.summaryProdName} numberOfLines={1}>{item.product?.name}</Text>
                  <Text style={styles.summaryProdQty}>{item.quantity} x ₹{Number(item.snapshotPrice).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.summaryProdTotal}>₹{Number(item.snapshotPrice * item.quantity).toLocaleString('en-IN')}</Text>
              </View>
            ))}

            <View style={[styles.divider, { marginVertical: verticalScale(15) }]} />

            {/* BREAKDOWN SECTION */}
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.value}>₹{Number(cartData.subtotal).toLocaleString('en-IN')}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Shipping</Text>
              <Text style={styles.value}>₹{Number(cartData.shippingCost || 0).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>GST</Text>
              <Text style={styles.value}>₹{Number(totals.taxTotal).toLocaleString('en-IN')}</Text>
            </View>

            {paymentMethod === 'cod' && (
              <View style={styles.summaryRow}>
                <Text style={styles.label}>COD Fee (3%)</Text>
                <Text style={styles.value}>₹{Number(totals.codFee).toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{Number(totals.finalTotal).toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>{paymentMethod === 'cod' ? 'Place COD Order' : `Pay ₹${Number(totals.finalTotal).toLocaleString('en-IN')}`}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={stateModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
            </View>
            <FlatList
              data={INDIAN_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.stateItem} onPress={() => { setForm({ ...form, state: item }); setStateModalVisible(false); }}>
                  <Text style={[styles.stateText, form.state === item && { color: '#1e3a8a', fontWeight: '700' }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeScreenWrapper>
  );
}

const LabeledInput = ({ label, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor="#94a3b8" {...props} />
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: horizontalScale(20), paddingVertical: verticalScale(18), backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#eee" },
  headerTitle: { fontSize: moderateScale(20), fontWeight: "800", marginLeft: horizontalScale(15), color: '#0f172a' },
  scroll: { padding: horizontalScale(16) },
  sectionTitle: { fontSize: moderateScale(16), fontWeight: "700", marginBottom: verticalScale(12), color: "#334155" },
  addrCard: { width: horizontalScale(160), padding: horizontalScale(16), backgroundColor: "#fff", borderRadius: moderateScale(14), marginRight: horizontalScale(10), borderWidth: 1, borderColor: "#e2e8f0" },
  addrLabel: { fontWeight: "700", marginBottom: verticalScale(4), color: '#0f172a' },
  addrText: { color: "#64748b", fontSize: moderateScale(12) },
  card: { backgroundColor: "#fff", padding: horizontalScale(20), borderRadius: moderateScale(20), marginBottom: verticalScale(16), elevation: 2 },
  inputWrapper: { marginBottom: verticalScale(14) },
  inputLabel: { fontSize: moderateScale(13), fontWeight: "600", color: "#64748b", marginBottom: verticalScale(6) },
  input: { backgroundColor: "#f8fafc", padding: horizontalScale(14), borderRadius: moderateScale(12), borderWidth: 1, borderColor: "#e2e8f0", color: "#000", fontSize: moderateScale(14) },
  row: { flexDirection: "row" },
  dropdownTrigger: { backgroundColor: "#f8fafc", padding: horizontalScale(14), borderRadius: moderateScale(12), borderWidth: 1, borderColor: "#e2e8f0", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: moderateScale(14), color: '#000' },
  payOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: horizontalScale(16), borderWidth: 1, borderColor: "#e2e8f0", borderRadius: moderateScale(14), marginBottom: verticalScale(10) },
  payLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  activePay: { borderColor: "#1e3a8a", backgroundColor: "#eff6ff" },
  disabledPay: { backgroundColor: "#f1f5f9" },
  payText: { fontSize: moderateScale(15), fontWeight: "600", color: '#0f172a' },
  summaryBox: { backgroundColor: "#fff", padding: horizontalScale(20), borderRadius: moderateScale(20), marginBottom: verticalScale(30), elevation: 2 },
  summaryTitle: { fontSize: moderateScale(18), fontWeight: "800", marginBottom: verticalScale(15), color: '#0f172a' },
  
  // DETAILED PRODUCT STYLES
  productSummaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(10) },
  productSummaryInfo: { flex: 1, marginRight: horizontalScale(10) },
  summaryProdName: { fontSize: moderateScale(14), fontWeight: '600', color: '#334155' },
  summaryProdQty: { fontSize: moderateScale(12), color: '#64748b', marginTop: verticalScale(2) },
  summaryProdTotal: { fontSize: moderateScale(14), fontWeight: '700', color: '#0f172a' },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: verticalScale(8) },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: verticalScale(10) },
  label: { color: "#64748b", fontSize: moderateScale(14) },
  value: { color: '#0f172a', fontWeight: '600', fontSize: moderateScale(14) },
  totalLabel: { fontSize: moderateScale(18), fontWeight: "800", color: '#0f172a' },
  totalValue: { fontSize: moderateScale(20), fontWeight: "900", color: "#1e3a8a" },
  checkoutBtn: { backgroundColor: "#1e3a8a", padding: verticalScale(18), borderRadius: moderateScale(14), alignItems: "center", marginTop: verticalScale(15) },
  checkoutText: { color: "#fff", fontSize: moderateScale(16), fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), height: '70%', padding: moderateScale(20) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(20) },
  modalTitle: { fontSize: moderateScale(18), fontWeight: '800', color: '#0f172a' },
  closeBtn: { color: '#dc2626', fontWeight: '700', fontSize: moderateScale(14) },
  stateItem: { paddingVertical: verticalScale(15), borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stateText: { fontSize: moderateScale(16), color: '#334155' },

  // Success Screen Styles
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: horizontalScale(30), backgroundColor: '#fff' },
  successIconBadge: { width: moderateScale(120), height: moderateScale(120), borderRadius: moderateScale(60), backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: verticalScale(20) },
  successTitle: { fontSize: moderateScale(28), fontWeight: '900', color: '#0f172a', marginBottom: verticalScale(10) },
  successSub: { fontSize: moderateScale(16), color: '#64748b', textAlign: 'center', marginBottom: verticalScale(30), lineHeight: moderateScale(22) },
  successCard: { width: '100%', backgroundColor: '#f8fafc', borderRadius: moderateScale(20), padding: moderateScale(20), marginBottom: verticalScale(30), borderWidth: 1, borderColor: '#e2e8f0' },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(12) },
  successLabel: { color: '#64748b', fontSize: moderateScale(14), fontWeight: '500' },
  successValue: { color: '#0f172a', fontSize: moderateScale(14), fontWeight: '700' },
  primaryBtn: { backgroundColor: '#1e3a8a', width: '100%', padding: verticalScale(18), borderRadius: moderateScale(16), alignItems: 'center', marginBottom: verticalScale(12), elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: moderateScale(16), fontWeight: '800' },
  secondaryBtn: { width: '100%', padding: verticalScale(18), borderRadius: moderateScale(16), alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#334155', fontSize: moderateScale(16), fontWeight: '700' }
});