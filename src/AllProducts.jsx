import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  PackageSearch,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';
import { Dropdown } from 'react-native-element-dropdown';

// 1. Import Scaling & Wrapper
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from './components/scaling';
import SafeScreenWrapper from './components/SafeScreenWrapper';
import { useCart } from './CartContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - horizontalScale(48)) / 2;
const BASE_URL = 'https://backend.umaxautospares.com/api/v1';
const LIMIT = 10;

/* ---------------- PRODUCT CARD ---------------- */
const ProductCard = ({ item, navigation, onStatusUpdate }) => {
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(item.minOrder || 1);
  const [localQty, setLocalQty] = useState(String(item.minOrder || 1));
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setQuantity(item.minOrder || 1);
    setLocalQty(String(item.minOrder || 1));
  }, [item.minOrder]);

  const discountPercentage =
    item.mrp > item.price
      ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
      : 0;

  const handleDecrement = () => {
    const min = item.minOrder || 1;
    const newVal = Math.max(min, quantity - 1);
    setQuantity(newVal);
    setLocalQty(String(newVal));
  };

  const handleIncrement = () => {
    const newVal = quantity + 1;
    setQuantity(newVal);
    setLocalQty(String(newVal));
  };

  const handleManualQuantity = text => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setLocalQty(cleaned);
  };

  const finalizeQty = () => {
    const min = item.minOrder || 1;
    const parsed = parseInt(localQty);
    if (isNaN(parsed) || parsed < min) {
      setQuantity(min);
      setLocalQty(String(min));
    } else {
      setQuantity(parsed);
      setLocalQty(String(parsed));
    }
  };

  const handleAdd = async () => {
    if (item.isOutOfStock) {
      onStatusUpdate(item.name, 'error', 'Out of Stock');
      return;
    }
    
    const min = item.minOrder || 1;
    const parsed = parseInt(localQty);
    const finalQty = isNaN(parsed) || parsed < min ? min : parsed;

    try {
      setIsAdding(true);
      await addToCart(item.id, finalQty);
      onStatusUpdate(item.name, 'success', 'Added to Cart');
    } catch (error) {
      onStatusUpdate(item.name, 'error', 'Could not add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={[styles.card, styles.shadow]}>
      <Pressable
        onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
      >
        <View style={styles.imageContainer}>
          <View style={styles.badgeRow}>
            {item.isUniversal && (
              <View style={styles.universalBadge}>
                <Text style={styles.universalText}>UNIVERSAL FIT</Text>
              </View>
            )}
            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {discountPercentage}% OFF
                </Text>
              </View>
            )}
          </View>
          
          <Image 
            source={{ uri: item.image }} 
            style={[styles.productImg, item.isOutOfStock && { opacity: 0.6 }]} 
            blurRadius={item.isOutOfStock ? 12 : 0}
          />
          
          {item.isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>SOLD OUT</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.brandName}>{item.brand.toUpperCase()}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              ₹{item.price.toLocaleString('en-IN')}
            </Text>
            {item.mrp > item.price && (
              <Text style={styles.mrpText}>₹{item.mrp}</Text>
            )}
          </View>
          <View style={styles.moqBadge}>
            <Text style={styles.moqText}>MOQ: {item.minOrder}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionRow}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={handleDecrement} 
            style={styles.qtyAction}
            disabled={item.isOutOfStock}
          >
            <Minus size={moderateScale(14)} color={item.isOutOfStock ? "#CBD5E1" : "#64748B"} />
          </TouchableOpacity>
          <View style={styles.qtyInputWrapper}>
            <TextInput
              style={[styles.qtyInput, item.isOutOfStock && { color: '#94A3B8' }]}
              value={localQty}
              onChangeText={handleManualQuantity}
              onBlur={finalizeQty}
              onSubmitEditing={finalizeQty}
              keyboardType="number-pad"
              maxLength={5}
              textAlign="center"
              editable={!item.isOutOfStock}
            />
          </View>
          <TouchableOpacity 
            onPress={handleIncrement} 
            style={styles.qtyAction}
            disabled={item.isOutOfStock}
          >
            <Plus size={moderateScale(14)} color={item.isOutOfStock ? "#CBD5E1" : "#64748B"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.cartBtn, item.isOutOfStock && styles.disabledCartBtn]} 
          onPress={handleAdd}
          disabled={item.isOutOfStock || isAdding}
        >
          {isAdding ? (
             <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ShoppingCart size={moderateScale(14)} color="#fff" />
              <Text style={styles.cartBtnText}>{item.isOutOfStock ? 'N/A' : 'ADD'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ---------------- MAIN SCREEN ---------------- */
const AllProducts = ({ navigation }) => {
  const route = useRoute();
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState(route.params?.initialSearch || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState(route.params?.initialBrand || null);
  const [selectedModel, setSelectedModel] = useState(route.params?.initialModel || null);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.initialCategory || null);

  const [filterBrand, setFilterBrand] = useState(route.params?.initialBrand || null);
  const [filterModel, setFilterModel] = useState(route.params?.initialModel || null);
  const [filterCategory, setFilterCategory] = useState(route.params?.initialCategory || null);

  const [statusVisible, setStatusVisible] = useState(false);
  const [statusType, setStatusType] = useState('success'); 
  const [statusMessage, setStatusMessage] = useState('');
  const [activeItemName, setActiveItemName] = useState('');

  const isFilterActive = !!(filterBrand || filterModel || filterCategory || searchQuery.trim() !== '');

  // --- SYNC SEARCH QUERY FROM HOME SCREEN ---
  useEffect(() => {
    if (route.params?.initialSearch !== undefined) {
      setSearchQuery(route.params.initialSearch);
      setCurrentPage(1);
    }
  }, [route.params?.initialSearch]);

  // --- FOCUS SEARCH BAR IF TRIGGERED ---
  useEffect(() => {
    if (route.params?.focusSearch && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [route.params?.focusSearch]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`${BASE_URL}/bikes/brands`),
          fetch(`${BASE_URL}/categories`),
        ]);
        const bData = await bRes.json();
        const cData = await cRes.json();
        
        const brandList = (bData?.data?.brands || []).map(b => ({ 
          label: String(b), 
          value: String(b) 
        }));
        setBrands(brandList);
        setCategories(cData?.data?.categories || []);
      } catch (err) {
        console.error("Metadata fetch error:", err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      return;
    }
    const fetchModels = async () => {
      try {
        const res = await fetch(`${BASE_URL}/bikes/models?brand=${encodeURIComponent(selectedBrand)}`);
        const result = await res.json();
        const modelList = (result?.data?.models || []).map(m => ({ 
          label: String(m), 
          value: String(m) 
        }));
        setModels(modelList);
      } catch (err) {
        console.error("Model fetch error:", err);
      }
    };
    fetchModels();
  }, [selectedBrand]);

  const fetchProducts = useCallback(
    async (page, query) => {
      setLoading(true);
      try {
        let url = `${BASE_URL}/products?page=${page}&limit=${LIMIT}`;
        if (query.trim() !== '') url += `&search=${encodeURIComponent(query)}`;
        if (filterBrand) url += `&brand=${encodeURIComponent(filterBrand)}`;
        if (filterModel) url += `&bikeModel=${encodeURIComponent(filterModel)}`;
        if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;

        const response = await fetch(url);
        const result = await response.json();
        const rawData = result?.data || [];
        const totalItems = result?.meta?.pagination?.total || 0;
        setTotalPages(Math.max(1, Math.ceil(totalItems / LIMIT)));

        setProducts(
          rawData.map(p => {
            const moq = p.minOrderQuantity || 1;
            const currentStock = p.stock ?? 0;
            return {
              id: p._id,
              name: p.name,
              brand: p.brand || 'Generic',
              price: p.salePrice || 0,
              mrp: p.baseMRP || 0,
              image: p.mainImage || 'https://via.placeholder.com/150',
              minOrder: moq,
              isUniversal: p.isUniversal || false,
              isOutOfStock: p.status !== 'active' || currentStock < moq,
            };
          }),
        );
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [filterBrand, filterModel, filterCategory],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(currentPage, searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [currentPage, searchQuery, fetchProducts]);

  const resetFilters = () => {
    setFilterBrand(null); setFilterModel(null); setFilterCategory(null);
    setSelectedBrand(null); setSelectedModel(null); setSelectedCategory(null);
    setSearchQuery(''); setCurrentPage(1);
    Keyboard.dismiss();
  };

  const handleStatusUpdate = (name, type, message) => {
    setActiveItemName(name);
    setStatusType(type);
    setStatusMessage(message);
    setStatusVisible(true);
    setTimeout(() => setStatusVisible(false), 2500);
  };

  const handleSearchBack = () => {
    if (searchQuery.length > 0) {
      setSearchQuery('');
      Keyboard.dismiss();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeScreenWrapper backgroundColor="#FFFFFF">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.mainTitle}>Auto Spares</Text>
              <Text style={styles.subTitle}>{products.length}+ Items Available</Text>
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, isFilterActive && styles.activeFilterBtn]}
              onPress={() => { Keyboard.dismiss(); setIsFilterVisible(true); }}
            >
              <SlidersHorizontal size={moderateScale(20)} color={isFilterActive ? '#fff' : '#1E3A8A'} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrapper}>
            <TouchableOpacity onPress={handleSearchBack} style={{ paddingRight: horizontalScale(8) }}>
              <ChevronLeft size={moderateScale(24)} color="#1E293B" />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              placeholder="Search or ask a question"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={text => { setSearchQuery(text); setCurrentPage(1); }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                <X size={moderateScale(18)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: verticalScale(40) }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <PackageSearch size={moderateScale(64)} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Spares Found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or search query.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={({ item }) => (
              <ProductCard item={item} navigation={navigation} onStatusUpdate={handleStatusUpdate} />
            )}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.listRow}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={styles.pager}>
                <TouchableOpacity disabled={currentPage === 1} onPress={() => setCurrentPage(p => Math.max(1, p - 1))} style={styles.pagerBtn}>
                  <ChevronLeft size={moderateScale(18)} color={currentPage === 1 ? '#CBD5E1' : '#1E3A8A'} />
                </TouchableOpacity>
                <Text style={styles.pagerText}>PAGE <Text style={styles.boldText}>{currentPage}</Text> / {totalPages}</Text>
                <TouchableOpacity disabled={currentPage >= totalPages} onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} style={styles.pagerBtn}>
                  <ChevronRight size={moderateScale(18)} color={currentPage >= totalPages ? '#CBD5E1' : '#1E3A8A'} />
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {statusVisible && (
          <View style={styles.successOverlay}>
             <View style={[styles.successBox, statusType === 'error' && { borderLeftColor: '#EF4444' }]}>
                {statusType === 'success' ? (
                  <CheckCircle2 size={32} color="#10B981" />
                ) : (
                  <AlertCircle size={32} color="#EF4444" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.successTitleText, statusType === 'error' && { color: '#EF4444' }]}>
                    {statusMessage}
                  </Text>
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

        <Modal visible={isFilterVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Products</Text>
                <TouchableOpacity onPress={() => setIsFilterVisible(false)}><X size={moderateScale(24)} color="#0F172A" /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSectionLabel}>VEHICLE DETAILS</Text>
                <Dropdown
                  data={brands}
                  labelField="label"
                  valueField="value"
                  value={selectedBrand}
                  placeholder="Select Brand"
                  onChange={i => { setSelectedBrand(i.value); setSelectedModel(null); }}
                  style={styles.dropdown}
                />
                <Dropdown
                  data={models}
                  labelField="label"
                  valueField="value"
                  value={selectedModel}
                  placeholder="Select Model"
                  disable={!selectedBrand}
                  onChange={i => setSelectedModel(i.value)}
                  style={styles.dropdown}
                />
                <Text style={[styles.modalSectionLabel, { marginTop: verticalScale(24) }]}>PRODUCT CATEGORY</Text>
                <View style={styles.categoryGrid}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[styles.categoryChip, selectedCategory === (cat.slug || cat._id) && styles.activeChip]}
                      onPress={() => setSelectedCategory(cat.slug || cat._id)}
                    >
                      <Text style={[styles.chipText, selectedCategory === (cat.slug || cat._id) && styles.activeChipText]}>{cat.name.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.clearBtn} onPress={() => { resetFilters(); setIsFilterVisible(false); }}><Text style={styles.clearBtnText}>RESET</Text></TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={() => { setFilterBrand(selectedBrand); setFilterModel(selectedModel); setFilterCategory(selectedCategory); setIsFilterVisible(false); setCurrentPage(1); }}><Text style={styles.applyBtnText}>APPLY FILTERS</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: horizontalScale(20), paddingTop: verticalScale(16), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(16) },
  mainTitle: { fontSize: moderateScale(24), fontWeight: '900', color: '#0F172A' },
  subTitle: { fontSize: moderateScale(12), color: '#64748B', marginTop: verticalScale(-2) },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: moderateScale(14), paddingHorizontal: horizontalScale(12), height: verticalScale(48), marginBottom: verticalScale(16), borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: moderateScale(14), color: '#0F172A', marginLeft: horizontalScale(4), fontWeight: '500' },
  filterBtn: { padding: moderateScale(10), backgroundColor: '#F1F5F9', borderRadius: moderateScale(12) },
  activeFilterBtn: { backgroundColor: '#1E3A8A' },
  listPadding: { paddingHorizontal: horizontalScale(16), paddingTop: verticalScale(16), paddingBottom: verticalScale(120) },
  listRow: { justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', width: COLUMN_WIDTH, borderRadius: moderateScale(20), marginBottom: verticalScale(16), overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  shadow: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } }) },
  imageContainer: { backgroundColor: '#F8FAFC', height: verticalScale(140), padding: moderateScale(12), justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badgeRow: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, padding: moderateScale(4) },
  universalBadge: { backgroundColor: '#1E293B', paddingHorizontal: horizontalScale(6), paddingVertical: verticalScale(2), borderRadius: moderateScale(4) },
  universalText: { color: '#FFFFFF', fontSize: moderateScale(8), fontWeight: '900' },
  discountBadge: { backgroundColor: '#EF4444', paddingHorizontal: horizontalScale(6), paddingVertical: verticalScale(2), borderRadius: moderateScale(4) },
  discountText: { color: '#FFFFFF', fontSize: moderateScale(8), fontWeight: '900' },
  productImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  outOfStockOverlay: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  outOfStockText: { color: '#EF4444', fontWeight: '900', fontSize: 10 },
  cardContent: { padding: horizontalScale(12) },
  brandName: { fontSize: moderateScale(9), color: '#1E3A8A', fontWeight: '900', letterSpacing: 0.5 },
  productName: { fontSize: moderateScale(13), fontWeight: '700', color: '#1E293B', marginTop: verticalScale(4), height: verticalScale(38), lineHeight: verticalScale(18) },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: verticalScale(8), gap: 6 },
  priceText: { fontSize: moderateScale(16), fontWeight: '900', color: '#0F172A' },
  mrpText: { fontSize: moderateScale(11), color: '#94A3B8', textDecorationLine: 'line-through' },
  moqBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: horizontalScale(6), paddingVertical: verticalScale(2), borderRadius: moderateScale(4), alignSelf: 'flex-start', marginTop: verticalScale(8) },
  moqText: { fontSize: moderateScale(9), color: '#EF4444', fontWeight: '900' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: horizontalScale(10), paddingBottom: verticalScale(12), paddingTop: verticalScale(4), gap: horizontalScale(8) },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: moderateScale(8), flex: 1.3, height: verticalScale(36), borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  qtyAction: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center' },
  qtyInputWrapper: { flex: 1.5, height: '100%', justifyContent: 'center' },
  qtyInput: { flex: 1, fontSize: moderateScale(14), fontWeight: '900', color: '#1E3A8A', padding: 0 },
  cartBtn: { flex: 1, backgroundColor: '#1E3A8A', height: verticalScale(36), borderRadius: moderateScale(8), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  disabledCartBtn: { backgroundColor: '#CBD5E1' },
  cartBtnText: { color: '#fff', fontSize: moderateScale(11), fontWeight: '900' },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: verticalScale(24), gap: horizontalScale(16) },
  pagerBtn: { width: horizontalScale(40), height: horizontalScale(40), backgroundColor: '#FFF', borderRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  pagerText: { fontSize: moderateScale(11), fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  boldText: { color: '#0F172A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: moderateScale(30), borderTopRightRadius: moderateScale(30), padding: moderateScale(24), maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(24) },
  modalTitle: { fontSize: moderateScale(20), fontWeight: '900', color: '#0F172A' },
  modalSectionLabel: { fontSize: moderateScale(10), fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: verticalScale(12) },
  dropdown: { backgroundColor: '#F8FAFC', paddingHorizontal: horizontalScale(12), paddingVertical: verticalScale(8), borderRadius: moderateScale(12), marginBottom: verticalScale(12), borderWidth: 1, borderColor: '#E2E8F0' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: horizontalScale(12), paddingVertical: verticalScale(8), borderRadius: moderateScale(10), backgroundColor: '#F1F5F9' },
  activeChip: { backgroundColor: '#1E3A8A' },
  chipText: { fontSize: moderateScale(11), fontWeight: '800', color: '#64748B' },
  activeChipText: { color: '#FFF' },
  modalFooter: { flexDirection: 'row', gap: horizontalScale(12), marginTop: verticalScale(32) },
  applyBtn: { backgroundColor: '#1E3A8A', flex: 2, height: verticalScale(50), justifyContent: 'center', alignItems: 'center', borderRadius: moderateScale(14) },
  applyBtnText: { color: '#fff', fontWeight: '900', fontSize: moderateScale(14) },
  clearBtn: { backgroundColor: '#F1F5F9', flex: 1, height: verticalScale(50), justifyContent: 'center', alignItems: 'center', borderRadius: moderateScale(14) },
  clearBtnText: { color: '#64748B', fontWeight: '900', fontSize: moderateScale(14) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: horizontalScale(40), marginTop: verticalScale(60) },
  emptyTitle: { fontSize: moderateScale(18), fontWeight: '900', color: '#0F172A', marginTop: verticalScale(16) },
  emptySub: { fontSize: moderateScale(14), color: '#64748B', textAlign: 'center', marginTop: verticalScale(8) },
  resetBtn: { marginTop: verticalScale(24), backgroundColor: '#1E3A8A', paddingHorizontal: horizontalScale(24), paddingVertical: verticalScale(14), borderRadius: moderateScale(16) },
  resetBtnText: { color: '#fff', fontWeight: '800' },
  successOverlay: { position: 'absolute', bottom: verticalScale(100), left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', width: '90%', padding: 15, borderRadius: 16, borderLeftWidth: 5, borderLeftColor: '#10B981', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 5, gap: 12 },
  successTitleText: { fontSize: 12, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
  successItemText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  goToCartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  goToCartText: { fontSize: 11, fontWeight: '900', color: '#1E3A8A' }
});

export default AllProducts;