import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  Modal, // 1. Added Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  AlertCircle,
  FileText,
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  X,
  Truck,
  ReceiptIndianRupee,
  ShoppingBag, // 2. Added ShoppingBag
} from 'lucide-react-native';
import RNBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from './components/scaling';
import SafeScreenWrapper from './components/SafeScreenWrapper';
import { getOrderById, cancelOrder } from './api';

const { width } = Dimensions.get('window');

// 3. Define the Preset Reasons (User-Friendly)
const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered the wrong item',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Wait for my paycheck',
  'Other (Specify below)',
];

export default function OrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { orderId } = route.params;

  const [cancelReason, setCancelReason] = useState('');
  const [selectedReasonIndex, setSelectedReasonIndex] = useState(null); // 4. Reason Chip state
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelledSuccess, setIsCancelledSuccess] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false); // 5. Confirm Modal state

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await getOrderById(orderId);
      return res.data.data.order;
    },
    enabled: !!orderId,
  });

  const cancelMutation = useMutation({
    mutationFn: reason => cancelOrder(orderId, reason),
    onSuccess: () => {
      // Instead of an generic Alert, we trigger the success view
      setIsCancelledSuccess(true);
      queryClient.invalidateQueries(['order', orderId]);
    },
    onError: err =>
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel'),
    onSettled: () => {
      // 6. Close the confirm modal after the API call finishes (success or error)
      setIsConfirmModalVisible(false);
    },
  });

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const invoiceUrl = `https://backend.umaxautospares.com/api/v1/orders/${orderId}/invoice`;
      const { dirs } = RNBlobUtil.fs;
      const path =
        Platform.OS === 'ios'
          ? `${dirs.DocumentDir}/Invoice-${order.orderNumber}.pdf`
          : `${dirs.DownloadDir}/Invoice-${order.orderNumber}.pdf`;

      const res = await RNBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path,
          mime: 'application/pdf',
        },
      }).fetch('GET', invoiceUrl, { Authorization: `Bearer ${token}` });

      if (Platform.OS === 'ios') RNBlobUtil.ios.previewDocument(res.path());
      else Alert.alert('Saved', 'Invoice saved to Downloads.');
    } catch (err) {
      Alert.alert('Error', 'Could not fetch invoice.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 7. Logic for selecting a reason chip
  const handleSelectReason = (index, reasonText) => {
    setSelectedReasonIndex(index);
    if (reasonText.startsWith('Other')) {
      // Focus the text input if "Other" is picked
      setCancelReason('');
    } else {
      setCancelReason(reasonText);
    }
  };

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );

  // --- CANCELLATION SUCCESS VIEW (Maintained from previous example) ---
  if (isCancelledSuccess) {
    return (
      <SafeScreenWrapper backgroundColor="#FFF">
        <View style={styles.successContainer}>
          <View style={styles.cancelIconCircle}>
            <X size={moderateScale(80)} color="#EF4444" />
          </View>
          <Text style={styles.successTitle}>Order Cancelled</Text>
          <Text style={styles.successSub}>
            Order #{order?.orderNumber} has been successfully cancelled. If you
            paid online, your refund will be processed as per policy.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
            <ShoppingBag size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeScreenWrapper>
    );
  }

  const isPending = order?.orderStatus === 'pending';
  const isDelivered = order?.orderStatus === 'delivered';
  const isShipped = order?.orderStatus === 'shipped';
  const isCancelled = order?.orderStatus === 'cancelled';
  const isPrepaidCompleted =
    order?.paymentMethod === 'Razorpay' && order?.paymentStatus === 'completed';

  return (
    <SafeScreenWrapper backgroundColor="#F8FAFC">
      {/* Header (Maintained UI) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={moderateScale(24)} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <Text style={styles.headerID}>#{order.orderNumber}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Visual Status Tracker - Logic Maintained */}
        {!isCancelled ? (
          <View style={[styles.statusCard, styles.shadow]}>
            <View style={styles.trackerRow}>
              <StatusNode active={true} icon={Clock} label="Placed" />
              <Connector active={isShipped || isDelivered} />
              <StatusNode
                active={isShipped || isDelivered}
                icon={Package}
                label="Packed"
              />
              <Connector active={isDelivered} />
              <StatusNode
                active={isDelivered}
                icon={CheckCircle2}
                label="Arrived"
              />
            </View>
            <View style={styles.statusFooter}>
              <Text style={styles.statusTextPrimary}>
                Current Status:{' '}
                <Text style={{ color: '#1E3A8A' }}>
                  {order.orderStatus.toUpperCase()}
                </Text>
              </Text>
              <Text style={styles.dateText}>
                {new Date(order.createdAt).toDateString()}
              </Text>
            </View>
          </View>
        ) : (
          // Maintain the custom logic to hide tracker if cancelled
          <View
            style={[
              styles.statusCard,
              styles.shadow,
              { borderColor: '#FEE2E2', borderWidth: 1 },
            ]}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <X size={24} color="#EF4444" />
              <Text
                style={{ fontSize: 16, fontWeight: '800', color: '#B91C1C' }}
              >
                ORDER CANCELLED
              </Text>
            </View>
            <Text style={{ marginTop: 8, color: '#64748B', fontSize: 12 }}>
              This order has been cancelled.
            </Text>
          </View>
        )}

        {(isDelivered || isPrepaidCompleted) && !isCancelled && (
          <TouchableOpacity
            style={styles.invoiceAction}
            onPress={handleDownloadInvoice}
            disabled={isDownloading}
          >
            <FileText size={moderateScale(18)} color="#FFF" />
            <Text style={styles.invoiceActionText}>
              {isDownloading ? 'Generating...' : 'Download Tax Invoice'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Info Grid (Maintained UI) */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoTile, styles.shadow]}>
            <View style={styles.tileHeader}>
              <MapPin size={12} color="#1E3A8A" />
              <Text style={styles.tileLabel}>SHIPPING TO</Text>
            </View>
            <Text style={styles.tileBold}>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </Text>
            <Text style={styles.tileLight} numberOfLines={2}>
              {order.shippingAddress.street}, {order.shippingAddress.city}
            </Text>
          </View>

          <View style={[styles.infoTile, styles.shadow]}>
            <View style={styles.tileHeader}>
              <CreditCard size={12} color="#1E3A8A" />
              <Text style={styles.tileLabel}>PAYMENT</Text>
            </View>
            <Text style={styles.tileBold}>{order.paymentMethod}</Text>
            <View
              style={[
                styles.miniBadge,
                {
                  backgroundColor:
                    order.paymentStatus === 'completed' ? '#DCFCE7' : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      order.paymentStatus === 'completed'
                        ? '#15803D'
                        : '#92400E',
                  },
                ]}
              >
                {order.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items (Maintained UI) */}
        <View style={[styles.sectionCard, styles.shadow]}>
          <Text style={styles.sectionHeader}>ITEMS ORDERED</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.productRow}>
              <View style={styles.productImgWrapper}>
                <Image
                  source={{ uri: item.mainImage }}
                  style={styles.productImg}
                />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.productMeta}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.productPrice}>
                ₹{item.subtotal.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>

        {/* Billing Details (Maintained UI) */}
        <View style={[styles.sectionCard, styles.shadow, { marginBottom: 20 }]}>
          <Text style={styles.sectionHeader}>BILLING DETAILS</Text>
          <BillRow
            label="Items Subtotal"
            value={`₹${order.subtotal.toLocaleString('en-IN')}`}
          />
          <BillRow label="Shipping Charge" value={`₹${order.shippingCost}`} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>
              ₹{order.total.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* --- ENHANCED CANCELLATION SECTION --- */}
        {isPending && !isCancelled && (
          <View style={[styles.cancelCard, styles.shadow]}>
            <Text style={styles.cancelTitle}>Cancel Order?</Text>
            <Text style={styles.cancelSubtitle}>
              Please select a reason to cancel this order.
            </Text>

            {/* 8. Render Preset Reasons (Chips) */}
            <View style={styles.reasonChipsContainer}>
              {CANCEL_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reasonChip,
                    selectedReasonIndex === index && styles.reasonChipSelected,
                  ]}
                  onPress={() => handleSelectReason(index, reason)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      selectedReasonIndex === index &&
                        styles.reasonChipTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 9. Render Text Input (Multiline) */}
            <TextInput
              style={styles.cancelInputMultiline}
              placeholder="Tell us more about your cancellation reason (Optional)"
              placeholderTextColor="#94A3B8"
              value={cancelReason}
              onChangeText={text => {
                setCancelReason(text);
                // 10. Clear selected reason if user starts typing manually
                if (selectedReasonIndex !== CANCEL_REASONS.length - 1) {
                  setSelectedReasonIndex(null);
                }
              }}
              multiline
              textAlignVertical="top"
            />

            {/* 11. Redesigned Confirm Button */}
            <TouchableOpacity
              style={[
                styles.cancelSubmitBtnNew,
                // Disable button if no reason provided
                !cancelReason && {
                  backgroundColor: '#FEE2E2',
                  borderColor: '#FECACA',
                },
              ]}
              disabled={!cancelReason || cancelMutation.isLoading}
              onPress={() => setIsConfirmModalVisible(true)}
            >
              <Text
                style={[
                  styles.cancelSubmitTextNew,
                  !cancelReason && { color: '#FECACA' },
                ]}
              >
                Cancel Order
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* --- CONFIRMATION MODAL (Final Safety Step) --- */}
      <Modal
        visible={isConfirmModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.cancelIconCircleSmall}>
              <AlertCircle size={moderateScale(32)} color="#B91C1C" />
            </View>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setIsConfirmModalVisible(false)}
              >
                <Text style={styles.modalBtnTextSecondary}>No, Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => cancelMutation.mutate(cancelReason)}
                disabled={cancelMutation.isLoading}
              >
                {cancelMutation.isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnTextPrimary}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreenWrapper>
  );
}

// --- HELPER COMPONENTS (Maintained) ---
const StatusNode = ({ active, icon: Icon, label }) => (
  <View style={styles.nodeContainer}>
    <View style={[styles.circleNode, active && styles.activeNode]}>
      <Icon size={16} color={active ? '#FFF' : '#CBD5E1'} />
    </View>
    <Text style={[styles.nodeLabel, active && styles.activeNodeLabel]}>
      {label}
    </Text>
  </View>
);

const Connector = ({ active }) => (
  <View style={[styles.connector, active && styles.activeConnector]} />
);

const BillRow = ({ label, value }) => (
  <View style={styles.billRow}>
    <Text style={styles.billLabel}>{label}</Text>
    <Text style={styles.billValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  // Preserved original styles...
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    height: verticalScale(60),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerID: {
    fontSize: moderateScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  headerSpacer: { width: horizontalScale(32) },
  scroll: { padding: horizontalScale(16) },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(20),
    padding: horizontalScale(20),
    marginBottom: verticalScale(16),
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
  },
  nodeContainer: { alignItems: 'center', width: horizontalScale(60) },
  circleNode: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNode: { backgroundColor: '#1E3A8A' },
  nodeLabel: {
    fontSize: moderateScale(10),
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 6,
  },
  activeNodeLabel: { color: '#1E3A8A' },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#F1F5F9',
    marginHorizontal: -10,
    marginTop: -15,
  },
  activeConnector: { backgroundColor: '#1E3A8A' },
  statusFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusTextPrimary: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  dateText: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    fontWeight: '500',
  },
  invoiceAction: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: 10,
    marginBottom: verticalScale(16),
  },
  invoiceActionText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  infoGrid: {
    flexDirection: 'row',
    gap: horizontalScale(12),
    marginBottom: verticalScale(16),
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: moderateScale(16),
    padding: horizontalScale(16),
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: verticalScale(8),
  },
  tileLabel: {
    fontSize: moderateScale(9),
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  tileBold: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },
  tileLight: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  miniBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  badgeText: { fontSize: moderateScale(9), fontWeight: '900' },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(20),
    padding: horizontalScale(20),
    marginBottom: verticalScale(16),
  },
  sectionHeader: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: verticalScale(16),
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  productImgWrapper: {
    width: horizontalScale(50),
    height: horizontalScale(50),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    padding: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  productInfo: { flex: 1, marginLeft: horizontalScale(12) },
  productName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },
  productMeta: { fontSize: moderateScale(11), color: '#94A3B8', marginTop: 2 },
  productPrice: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  billLabel: {
    fontSize: moderateScale(13),
    color: '#64748B',
    fontWeight: '500',
  },
  billValue: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: verticalScale(12),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#1E3A8A',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Preserved Success View styles...
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: horizontalScale(30),
    backgroundColor: '#FFF',
  },
  cancelIconCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  successTitle: {
    fontSize: moderateScale(26),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: verticalScale(10),
  },
  successSub: {
    fontSize: moderateScale(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(30),
  },
  primaryBtn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: verticalScale(16),
    paddingHorizontal: horizontalScale(30),
    borderRadius: moderateScale(15),
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },

  // --- NEW ENHANCED CANCELLATION STYLES ---
  cancelCard: {
    backgroundColor: '#FFF',
    padding: horizontalScale(20),
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(30),
  },
  cancelTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#1E293B',
  },
  cancelSubtitle: {
    fontSize: moderateScale(13),
    color: '#64748B',
    marginVertical: verticalScale(8),
  },

  reasonChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: verticalScale(12),
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reasonChipSelected: { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' },
  reasonChipText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  reasonChipTextSelected: { color: '#1E3A8A', fontWeight: '700' },

  cancelInputMultiline: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: moderateScale(12),
    height: verticalScale(100),
    color: '#1E293B',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(15),
  },

  cancelSubmitBtnNew: {
    backgroundColor: '#EF4444',
    padding: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  cancelSubmitTextNew: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },

  // --- NEW CONFIRMATION MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  confirmModalContent: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
    width: '90%',
    alignItems: 'center',
  },
  cancelIconCircleSmall: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: verticalScale(8),
  },
  modalSubtitle: {
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(20),
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  modalBtnTextPrimary: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  modalBtnTextSecondary: {
    color: '#475569',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});
