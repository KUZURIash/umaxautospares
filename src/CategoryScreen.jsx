import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight 
} from 'lucide-react-native';

import { useCart } from './CartContext';
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from './components/scaling';
import SafeScreenWrapper from './components/SafeScreenWrapper';

const BASE_URL = 'https://backend.umaxautospares.com/api/v1';

/* ---------------- PRODUCT CARD COMPONENT ---------------- */
const ProductCard = ({ item, onStatusUpdate }) => {
  const { addToCart } = useCart();
  const navigation = useNavigation();
  const inputRef = useRef(null);

  const minQty = item.minOrderQuantity || item.minOrder || 1;
  const [quantity, setQuantity] = useState(minQty);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setQuantity(minQty);
  }, [minQty]);

  const handleIncrement = () => !item.isOutOfStock && setQuantity(prev => prev + 1);
  const handleDecrement = () => !item.isOutOfStock && setQuantity(prev => Math.max(minQty, prev - 1));

  const handleManualQuantity = text => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setQuantity('');
    } else {
      setQuantity(parseInt(cleaned));
    }
  };

  const handleBlur = () => {
    if (quantity === '' || quantity < minQty) {
      setQuantity(minQty);
    }
  };

  const handleAdd = async () => {
    if (item.isOutOfStock) {
      onStatusUpdate(item.name, 'error', 'Out of Stock');
      return;
    }

    const finalQty = quantity === '' ? minQty : quantity;
    try {
      setIsAdding(true);
      await addToCart(item._id, finalQty);
      onStatusUpdate(item.name, 'success', 'Added to Cart');
    } catch (error) {
      onStatusUpdate(item.name, 'error', 'Failed to Add');
    } finally {
      setIsAdding(false);
    }
  };

  const hasDiscount = item.baseMRP > item.salePrice;
  const displayMRP = item.baseMRP;

  return (
    <View style={styles.productCard}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
      >
        <View style={styles.imageBox}>
          <Image
            source={{ uri: item.mainImage || 'https://via.placeholder.com/150' }}
            style={[styles.pImg, item.isOutOfStock && { opacity: 0.6 }]}
            blurRadius={item.isOutOfStock ? 12 : 0}
          />
          {item.discount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.discount}% OFF</Text>
            </View>
          )}
          {item.isOutOfStock && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.pContent}>
        <Text style={styles.pName} numberOfLines={2}>{item.name}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.pPrice}>₹{item.salePrice.toLocaleString('en-IN')}</Text>
          {hasDiscount && <Text style={styles.mrpText}>₹{displayMRP}</Text>}
        </View>

        <View style={styles.moqPill}>
          <Text style={styles.moqText}>Min Qty: {minQty}</Text>
        </View>

        <View style={styles.actionRow}>
          <View style={[styles.quantitySelector, item.isOutOfStock && { opacity: 0.5 }]}>
            <TouchableOpacity onPress={handleDecrement} style={styles.qtyBtn} disabled={item.isOutOfStock}>
              <Minus size={moderateScale(14)} color="#1E3A8A" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.qtyNumberInput}
              value={String(quantity)}
              onChangeText={handleManualQuantity}
              onBlur={handleBlur}
              keyboardType="number-pad"
              editable={!item.isOutOfStock}
              textAlign="center"
            />

            <TouchableOpacity onPress={handleIncrement} style={styles.qtyBtn} disabled={item.isOutOfStock}>
              <Plus size={moderateScale(14)} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addCartBtn, (item.isOutOfStock || isAdding) && { backgroundColor: '#CBD5E1' }]}
            onPress={handleAdd}
            disabled={isAdding}
          >
            {isAdding ? <ActivityIndicator size="small" color="#FFF" /> : <ShoppingBag size={moderateScale(16)} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/* ---------------- MAIN CATEGORY SCREEN ---------------- */
const CategoryScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Status State
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusType, setStatusType] = useState('success');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeItemName, setActiveItemName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await fetch(`${BASE_URL}/categories`);
      const data = await res.json();
      if (data.success) {
        const catList = data.data.categories || [];
        setCategories(catList);
        if (catList.length > 0) handleCategorySelect(catList[0]);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    } finally {
      setLoadingCats(false);
    }
  };

  const handleCategorySelect = category => {
    setSelectedCategory(category);
    fetchProductsByCategory(category.slug || category._id);
  };

  const fetchProductsByCategory = async slugOrId => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${BASE_URL}/products?category=${slugOrId}`);
      const data = await res.json();
      const rawProducts = data.data.products || data.data || [];

      // Unified Backend Data Mapping
      const mapped = rawProducts.map(p => {
        const moq = p.minOrderQuantity || p.minOrder || 1;
        const stock = p.stock ?? 0;
        return {
          ...p,
          isOutOfStock: p.status !== 'active' || stock < moq
        };
      });

      setProducts(mapped);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleStatusUpdate = (name, type, message) => {
    setActiveItemName(name);
    setStatusType(type);
    setStatusMessage(message);
    setStatusVisible(true);
    setTimeout(() => setStatusVisible(false), 2500);
  };

  const renderSidebarItem = ({ item }) => {
    const isActive = selectedCategory?._id === item._id;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.sidebarItem, isActive && styles.activeSidebarItem]}
        onPress={() => handleCategorySelect(item)}
      >
        <View style={[styles.catIconBox, isActive && styles.activeIconBox]}>
          <Image source={{ uri: item.image }} style={styles.sidebarImg} resizeMode="contain" />
        </View>
        <Text style={[styles.sidebarText, isActive && styles.activeSidebarText]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreenWrapper backgroundColor="#FFFFFF">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={moderateScale(28)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <ShoppingBag size={moderateScale(24)} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.sidebar}>
          {loadingCats ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={categories}
              renderItem={renderSidebarItem}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text style={styles.categoryHeading}>{selectedCategory?.name}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.itemCount}>{products.length} Items</Text>
            </View>
          </View>

          {loadingProducts ? (
            <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>
          ) : (
            <FlatList
              data={products}
              renderItem={({ item }) => <ProductCard item={item} onStatusUpdate={handleStatusUpdate} />}
              keyExtractor={item => item._id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              ListEmptyComponent={<Text style={styles.emptyText}>No items found</Text>}
            />
          )}
        </View>
      </View>

      {/* UNIFIED STATUS OVERLAY */}
      {statusVisible && (
        <View style={styles.successOverlay}>
           <View style={[styles.successBox, statusType === 'error' && { borderLeftColor: '#EF4444' }]}>
              {statusType === 'success' ? <CheckCircle2 size={32} color="#10B981" /> : <AlertCircle size={32} color="#EF4444" />}
              <View style={{ flex: 1 }}>
                <Text style={[styles.successTitleText, statusType === 'error' && { color: '#EF4444' }]}>{statusMessage}</Text>
                <Text style={styles.successItemText} numberOfLines={1}>{activeItemName}</Text>
              </View>
              {statusType === 'success' && (
                <TouchableOpacity style={styles.goToCartBtn} onPress={() => { setStatusVisible(false); navigation.navigate('Cart'); }}>
                  <Text style={styles.goToCartText}>VIEW</Text>
                  <ArrowRight size={14} color="#1E3A8A" />
                </TouchableOpacity>
              )}
           </View>
        </View>
      )}
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: horizontalScale(16), height: verticalScale(56), backgroundColor: '#FFF' },
  headerTitle: { fontSize: moderateScale(20), fontWeight: '700', color: '#0F172A' },
  mainContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { width: horizontalScale(90), backgroundColor: '#F1F5F9',height: '100%', paddingBottom: verticalScale(50)},
  sidebarItem: { paddingVertical: verticalScale(14), alignItems: 'center', marginVertical: 4,paddingBottom: verticalScale(10), },
  activeSidebarItem: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderBottomLeftRadius: 20, marginLeft: 8, elevation: 2 },
  catIconBox: { width: horizontalScale(50), height: horizontalScale(50), borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  activeIconBox: { backgroundColor: '#DBEAFE' },
  sidebarImg: { width: '60%', height: '60%' },
  sidebarText: { fontSize: moderateScale(10), fontWeight: '500', color: '#64748B', textAlign: 'center', paddingHorizontal: 4 },
  activeSidebarText: { color: '#2563EB', fontWeight: '700' },
  content: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, overflow: 'hidden' },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  categoryHeading: { fontSize: moderateScale(16), fontWeight: '700', color: '#1E293B' },
  countBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  itemCount: { fontSize: moderateScale(10), color: '#64748B', fontWeight: '600' },
  productList: { paddingHorizontal: 8, paddingBottom: 60 },
  productCard: { flex: 1, margin: 6, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  imageBox: { height: verticalScale(110), backgroundColor: '#F8FAFC', borderTopLeftRadius: 16, borderTopRightRadius: 16, justifyContent: 'center', alignItems: 'center' },
  pImg: { width: '80%', height: '80%', resizeMode: 'contain' },
  soldOutOverlay: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.6)', padding: 4, borderRadius: 4 },
  soldOutText: { color: '#EF4444', fontWeight: '900', fontSize: 10 },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  pContent: { padding: 12 },
  pName: { fontSize: moderateScale(13), fontWeight: '600', color: '#334155', height: 38, lineHeight: 18 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  pPrice: { fontSize: moderateScale(15), fontWeight: '800', color: '#0F172A' },
  mrpText: { fontSize: moderateScale(10), color: '#94A3B8', textDecorationLine: 'line-through' },
  moqPill: { marginTop: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  moqText: { fontSize: moderateScale(9), color: '#EF4444', fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  quantitySelector: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', height: 36 },
  qtyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qtyNumberInput: { fontSize: moderateScale(13), fontWeight: '800', color: '#1E3A8A', flex: 1.5, padding: 0 },
  addCartBtn: { backgroundColor: '#1E3A8A', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#94A3B8' },

  // Status Box Styles
  successOverlay: { position: 'absolute', bottom: verticalScale(100), left: 0, right: 0, alignItems: 'center', zIndex:9999,elevation: 50 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', width: '90%', padding: 15, borderRadius: 16, borderLeftWidth: 5, borderLeftColor: '#10B981', elevation: 10, gap: 12,shadowColor: '#000',shadowOffset: { width: 0, height: 10 },shadowOpacity: 0.3,shadowRadius: 10, },
  successTitleText: { fontSize: 12, fontWeight: '900', color: '#10B981' },
  successItemText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  goToCartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  goToCartText: { fontSize: 11, fontWeight: '900', color: '#1E3A8A' }
});

export default CategoryScreen;