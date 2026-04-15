import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, TouchableOpacity, 
  StyleSheet, Alert, Image, Dimensions, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ShoppingCart, Trash2, Heart, ChevronRight, Star } from 'lucide-react-native';

// Import your scaling tools and wrapper
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 
import api from './api'; 
import { useCart } from './CartContext'; 

const { width } = Dimensions.get('window');
// Dynamic column width based on scaled padding
const COLUMN_WIDTH = (width - horizontalScale(48)) / 2;

const WishlistScreen = ({ navigation }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  
  const { moveToCart } = useCart(); 

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/wishlist');
      setWishlist(response.data?.data?.wishlist?.items || []);
    } catch (err) {
      console.error("Wishlist Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchWishlist(); }, [fetchWishlist]));

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      fetchWishlist(); 
    } catch (err) { 
        Alert.alert("Error", "Failed to remove item"); 
    }
  };

  const handleMoveToCart = async (productId) => {
    setMovingId(productId);
    try {
        await moveToCart(productId);
        fetchWishlist();
    } catch (error) {
        fetchWishlist();
    } finally {
        setMovingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const product = item.productId;
    if (!product) return null;

    const discountPercentage = product.baseMRP > product.salePrice 
      ? Math.round(((product.baseMRP - product.salePrice) / product.baseMRP) * 100) 
      : 0;

    return (
      <View style={[styles.card, styles.shadow]}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('ProductDetail', { id: product._id })}
        >
          <View style={styles.imgContainer}>
            <Image source={{ uri: product.mainImage }} style={styles.productImg} />
            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <Star size={moderateScale(8)} color="#EAB308" fill="#EAB308" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.brandName}>{product.brand?.name?.toUpperCase() || "GENUINE"}</Text>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>₹{product.salePrice.toLocaleString('en-IN')}</Text>
              {discountPercentage > 0 && (
                <Text style={styles.mrpText}>₹{product.baseMRP.toLocaleString('en-IN')}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          {/* CART BUTTON COMMENTED OUT AS REQUESTED */}
          {/* <TouchableOpacity 
            style={[styles.cartBtn, movingId === product._id && styles.btnDisabled]} 
            onPress={() => handleMoveToCart(product._id)}
            disabled={movingId === product._id}
          >
            {movingId === product._id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <ShoppingCart size={moderateScale(14)} color="#fff" strokeWidth={2.5} />
                <Text style={styles.btnText}>ADD TO CART</Text>
              </>
            )}
          </TouchableOpacity>
          */}
          
          {/* REMOVE BUTTON INCREASED TO FULL LENGTH */}
          <TouchableOpacity style={styles.removeBtnFull} onPress={() => handleRemove(product._id)}>
            <Trash2 size={moderateScale(16)} color="#EF4444" />
            <Text style={styles.removeBtnText}>REMOVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeScreenWrapper backgroundColor="#F8FAFC">
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.itemCount}>{wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} saved</Text>
        </View>
        <View style={styles.heartCircle}>
            <Heart size={moderateScale(20)} color="#1E3A8A" fill="#1E3A8A" />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={wishlist}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item) => item.productId?._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Heart size={moderateScale(40)} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
              <Text style={styles.emptyText}>Save items that you like now and buy them later.</Text>
              <TouchableOpacity 
                style={styles.browseBtn}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.browseBtnText}>Start Shopping</Text>
                <ChevronRight size={moderateScale(18)} color="#fff" />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: horizontalScale(20), 
    paddingVertical: verticalScale(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: moderateScale(24), fontWeight: '900', color: '#0F172A' },
  itemCount: { fontSize: moderateScale(12), color: '#64748B', fontWeight: '600', marginTop: 2 },
  heartCircle: { 
    width: horizontalScale(40), 
    height: horizontalScale(40), 
    borderRadius: horizontalScale(20), 
    backgroundColor: '#EFF6FF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { 
    paddingHorizontal: horizontalScale(16), 
    paddingBottom: verticalScale(100), 
    paddingTop: verticalScale(16) 
  },
  columnWrapper: { justifyContent: 'space-between' },
  card: { 
    backgroundColor: '#fff', 
    width: COLUMN_WIDTH, 
    borderRadius: moderateScale(20), 
    marginBottom: verticalScale(16), 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    overflow: 'hidden'
  },
  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  imgContainer: { 
    backgroundColor: '#F8FAFC', 
    height: verticalScale(150), 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: horizontalScale(15),
    position: 'relative'
  },
  productImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(4),
    borderBottomRightRadius: moderateScale(12),
  },
  discountText: { color: '#fff', fontSize: moderateScale(9), fontWeight: '900' },
  ratingBadge: {
    position: 'absolute',
    top: verticalScale(8),
    right: horizontalScale(8),
    backgroundColor: '#FFF',
    paddingHorizontal: horizontalScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    elevation: 2
  },
  ratingText: { fontSize: moderateScale(9), fontWeight: '800', color: '#0F172A' },
  content: { padding: horizontalScale(12) },
  brandName: { fontSize: moderateScale(9), color: '#2563EB', fontWeight: '800', letterSpacing: 0.5 },
  productName: { 
    fontSize: moderateScale(13), 
    fontWeight: '700', 
    color: '#334155', 
    marginTop: verticalScale(4), 
    height: verticalScale(36), 
    lineHeight: verticalScale(18) 
  },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: verticalScale(8), gap: 6 },
  priceText: { fontSize: moderateScale(16), fontWeight: '900', color: '#0F172A' },
  mrpText: { fontSize: moderateScale(11), color: '#94A3B8', textDecorationLine: 'line-through' },
  actionRow: { 
    flexDirection: 'row', 
    paddingHorizontal: horizontalScale(12), 
    paddingBottom: verticalScale(12), 
  },
  cartBtn: { 
    flex: 1, 
    backgroundColor: '#1E3A8A', 
    height: verticalScale(38), 
    borderRadius: moderateScale(10), 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 6 
  },
  // Updated to span full width
  removeBtnFull: { 
    flex: 1, 
    height: verticalScale(38), 
    backgroundColor: '#FEF2F2', 
    borderRadius: moderateScale(10), 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    gap: horizontalScale(6),
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: moderateScale(11),
    fontWeight: '800'
  },
  btnText: { color: '#fff', fontSize: moderateScale(9), fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: verticalScale(60), paddingHorizontal: horizontalScale(40) },
  emptyIconCircle: { 
    width: horizontalScale(100), 
    height: horizontalScale(100), 
    borderRadius: horizontalScale(50), 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: verticalScale(20) 
  },
  emptyTitle: { fontSize: moderateScale(20), fontWeight: '800', color: '#1E293B' },
  emptyText: { color: '#64748B', fontSize: moderateScale(14), textAlign: 'center', marginTop: verticalScale(10), lineHeight: verticalScale(22) },
  browseBtn: { 
    marginTop: verticalScale(30), 
    backgroundColor: '#1E3A8A', 
    paddingHorizontal: horizontalScale(28), 
    paddingVertical: verticalScale(16), 
    borderRadius: moderateScale(18),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: moderateScale(15) }
});

export default WishlistScreen;