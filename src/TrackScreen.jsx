import React from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, 
  StyleSheet, RefreshControl, Dimensions, Platform 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, ChevronRight, Clock, CheckCircle2, 
  XCircle, Truck, Inbox, Calendar 
} from 'lucide-react-native';

// 1. Import Scaling & Wrapper
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 
import { getOrders } from './api';

const { width } = Dimensions.get('window');

const statusMap = {
  pending: { color: '#B45309', bg: '#FFFBEB', icon: Clock, label: 'Pending' },
  confirmed: { color: '#1E3A8A', bg: '#EFF6FF', icon: Package, label: 'Confirmed' },
  shipped: { color: '#6B21A8', bg: '#F3E8FF', icon: Truck, label: 'In Transit' },
  delivered: { color: '#15803D', bg: '#F0FDF4', icon: CheckCircle2, label: 'Delivered' },
  cancelled: { color: '#B91C1C', bg: '#FEF2F2', icon: XCircle, label: 'Cancelled' },
};

export default function TrackScreen({ navigation }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders({ page: 1, limit: 20 }),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const orders = data?.data?.data || [];

  const renderItem = ({ item }) => {
    const status = statusMap[item.orderStatus] || statusMap.pending;
    const StatusIcon = status.icon;

    return (
      <View style={styles.cardWrapper}>
        {/* The Timeline Line - Scaled left positioning */}
        <View style={[styles.timelineLine, { backgroundColor: status.color + '30' }]} />
        
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.orderCard, styles.shadowProp]} 
          onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
        >
          {/* Status Icon Section */}
          <View style={[styles.iconContainer, { backgroundColor: status.bg }]}>
            <StatusIcon size={moderateScale(20)} color={status.color} strokeWidth={2.5} />
          </View>

          {/* Order Details */}
          <View style={styles.orderMain}>
            <View style={styles.titleRow}>
              <Text style={styles.orderNo} numberOfLines={1}>#{item.orderNumber}</Text>
              <Text style={styles.orderTotal}>₹{Number(item.total).toLocaleString('en-IN')}</Text>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.dateInfo}>
                <Calendar size={moderateScale(12)} color="#94A3B8" />
                <Text style={styles.orderDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { 
                    day: '2-digit', month: 'short' 
                  })}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
          </View>

          <ChevronRight size={moderateScale(18)} color="#CBD5E1" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1E3A8A" />
      <Text style={styles.loadingText}>Syncing your orders...</Text>
    </View>
  );

  return (
    <SafeScreenWrapper backgroundColor="#F8FAFC">
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <Text style={styles.headerCount}>{orders.length} active shipments</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
          <Clock size={moderateScale(20)} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor="#1E3A8A" 
            colors={['#1E3A8A']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Inbox size={moderateScale(40)} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>When you place an order, it will appear here for tracking.</Text>
          </View>
        }
      />
    </SafeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20), 
    paddingVertical: verticalScale(20), 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: moderateScale(24), fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  headerCount: { fontSize: moderateScale(13), color: '#64748B', fontWeight: '500', marginTop: verticalScale(2) },
  refreshBtn: { padding: moderateScale(10), backgroundColor: '#EFF6FF', borderRadius: moderateScale(12) },
  listContent: { padding: horizontalScale(20), paddingBottom: verticalScale(120) },
  
  cardWrapper: { position: 'relative', paddingLeft: horizontalScale(12), marginBottom: verticalScale(16) },
  timelineLine: { 
    position: 'absolute', 
    left: 0, 
    top: verticalScale(20), 
    bottom: verticalScale(-20), 
    width: horizontalScale(3), 
    borderRadius: 3 
  },
  orderCard: { 
    backgroundColor: '#fff', 
    borderRadius: moderateScale(20), 
    padding: horizontalScale(16), 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  shadowProp: { 
    ...Platform.select({ 
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 }, 
      android: { elevation: 3 } 
    }) 
  },
  iconContainer: { 
    width: horizontalScale(48), 
    height: horizontalScale(48), 
    borderRadius: moderateScale(14), 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: horizontalScale(16) 
  },
  orderMain: { flex: 1, marginRight: horizontalScale(8) },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(6) },
  orderNo: { fontSize: moderateScale(16), fontWeight: '800', color: '#1E293B', flex: 1 },
  orderTotal: { fontSize: moderateScale(16), fontWeight: '900', color: '#0F172A' },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderDate: { fontSize: moderateScale(12), color: '#94A3B8', fontWeight: '600' },
  
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: horizontalScale(8), 
    paddingVertical: verticalScale(4), 
    borderRadius: moderateScale(8),
    gap: 5
  },
  statusDot: { width: horizontalScale(6), height: horizontalScale(6), borderRadius: 3 },
  statusText: { fontSize: moderateScale(11), fontWeight: '800', textTransform: 'uppercase' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: verticalScale(12), color: '#64748B', fontWeight: '600', fontSize: moderateScale(14) },
  
  emptyContainer: { alignItems: 'center', marginTop: verticalScale(100), paddingHorizontal: horizontalScale(40) },
  emptyIconCircle: { 
    width: horizontalScale(80), height: horizontalScale(80), borderRadius: horizontalScale(40), 
    backgroundColor: '#F1F5F9', justifyContent: 'center', 
    alignItems: 'center', marginBottom: verticalScale(20) 
  },
  emptyTitle: { fontSize: moderateScale(20), fontWeight: '800', color: '#1E293B', marginBottom: verticalScale(8) },
  emptyText: { color: '#94A3B8', fontSize: moderateScale(14), textAlign: 'center', lineHeight: verticalScale(20) }
});