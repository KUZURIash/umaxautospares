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
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Heart,
  User,
  Zap,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from './components/scaling';
import SafeScreenWrapper from './components/SafeScreenWrapper';
import { useCart } from './CartContext';

const { width } = Dimensions.get('window');

// CONFIG
const BASE_URL = 'https://backend.umaxautospares.com/api/v1';
const SITE_DOMAIN = 'https://backend.umaxautospares.com/api/v1';

const HomeScreens = () => {
  const navigation = useNavigation();
  const heroRef = useRef(null);
  const { addToCart } = useCart();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [heroBanners, setHeroBanners] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- API LOGIC ---
  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes, bRes] = await Promise.all([
        fetch(`${BASE_URL}/products?limit=6&page=1`),
        fetch(`${BASE_URL}/products?limit=6&page=2`),
        fetch(`${BASE_URL}/settings/banners`),
      ]);

      const tData = await tRes.json();
      const sData = await sRes.json();
      const bData = await bRes.json();

      const apiBanners = bData.data?.banners || bData.banners || [];

      if (Array.isArray(apiBanners) && apiBanners.length > 0) {
        setHeroBanners(
          apiBanners.map((b, index) => ({
            ...b,
            stableKey: b._id ? b._id.toString() : `banner-${index}`,
          })),
        );
      } else {
        setHeroBanners([
          { stableKey: 'fb1', title: 'UMAX Spares', imageUrl: null },
        ]);
      }

      setTrendingProducts(tData.data?.products || tData.data || []);
      setSimilarProducts(sData.data?.products || sData.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- AUTO SCROLL LOGIC ---
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const heroInterval = setInterval(() => {
      let nextIndex = (currentHeroIndex + 1) % heroBanners.length;
      try {
        heroRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentHeroIndex(nextIndex);
      } catch (error) {}
    }, 4000);
    return () => clearInterval(heroInterval);
  }, [currentHeroIndex, heroBanners]);

  // --- ACTIONS ---
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigates to the AllProducts screen (named 'Products') and passes the query
      navigation.navigate('Products', {
        initialSearch: searchQuery.trim(),
        focusSearch: false,
      });
      setSearchQuery('');
      Keyboard.dismiss();
    }
  };

  const onAddToCart = item => {
    const qty = item.minOrderQuantity || 1;
    addToCart(item._id, qty);

    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${item.name.substring(0, 25)}... added!`,
      position: 'top',
      topOffset: verticalScale(50),
    });
  };

  const renderHeroItem = ({ item }) => {
    const imgPath = item.imageUrl || item.image;
    let uri = null;
    if (imgPath) {
      uri = imgPath.startsWith('http')
        ? imgPath
        : `${SITE_DOMAIN}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
    }
    return (
      <Pressable
        style={styles.heroWrapper}
        onPress={() => {
          if (item.title) {
            navigation.navigate('Products', { initialSearch: item.title });
          }
        }}
      >
        <View style={styles.heroBannerContainer}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.heroImageFull}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#1E3A8A', '#3B82F6']}
              style={styles.heroImageFull}
            >
              <Text style={styles.fallbackText}>{item.title}</Text>
            </LinearGradient>
          )}
        </View>
      </Pressable>
    );
  };

  const renderProductItem = ({ item }) => {
    const hasDiscount = item.baseMRP > item.salePrice;
    const discountPercentage = hasDiscount
      ? Math.round(((item.baseMRP - item.salePrice) / item.baseMRP) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
      >
        <View style={styles.imageBox}>
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
            source={{
              uri: item.mainImage || 'https://via.placeholder.com/150',
            }}
            style={styles.pImg}
          />
        </View>
        <Text style={styles.pName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.pFooter}>
          <View>
            <Text style={styles.pPrice}>₹{item.salePrice}</Text>
            {hasDiscount && <Text style={styles.mrpText}>₹{item.baseMRP}</Text>}
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddToCart(item)}
          >
            <ShoppingBag size={moderateScale(14)} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <SafeScreenWrapper backgroundColor="#F8FAFC">
      <LinearGradient
        colors={['#DBEAFE', '#F8FAFC']}
        style={styles.headerGradient}
      >
        <View style={styles.topBar}>
          <Image
            source={require('./assets/logo.jpg')}
            style={styles.logoStyle}
            resizeMode="contain"
          />
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Wishlist')}
              style={styles.iconCircle}
            >
              <Heart
                size={moderateScale(20)}
                color="#1E3A8A"
                strokeWidth={2.5}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Account')}
              style={styles.iconCircle}
            >
              <User
                size={moderateScale(20)}
                color="#1E3A8A"
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search
              size={moderateScale(20)}
              color="#2563EB"
              strokeWidth={2.5}
            />
            <TextInput
              placeholder="Search spare parts..."
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <View style={styles.searchDivider} />
            <TouchableOpacity onPress={handleSearch}>
              <SlidersHorizontal size={moderateScale(18)} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        <View style={styles.heroContainer}>
          <FlatList
            ref={heroRef}
            data={heroBanners}
            renderItem={renderHeroItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.stableKey}
          />
        </View>

        <View style={styles.secHead}>
          <View style={styles.row}>
            <Zap size={moderateScale(18)} color="#2563EB" fill="#2563EB" />
            <Text style={styles.secTitle}>Trending Now</Text>
          </View>
        </View>
        <FlatList
          horizontal
          data={trendingProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Best Sellers for You</Text>
        </View>
        <View style={styles.similarGrid}>
          {similarProducts.map(item => {
            const hasDiscount = item.baseMRP > item.salePrice;
            const discountPercentage = hasDiscount
              ? Math.round(
                  ((item.baseMRP - item.salePrice) / item.baseMRP) * 100,
                )
              : 0;
            return (
              <TouchableOpacity
                key={item._id}
                style={styles.similarCard}
                onPress={() =>
                  navigation.navigate('ProductDetail', { id: item._id })
                }
              >
                <View style={styles.similarImgBox}>
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
                    source={{ uri: item.mainImage }}
                    style={styles.similarImg}
                  />
                </View>
                <Text style={styles.similarName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.similarFooter}>
                  <View>
                    <Text style={styles.similarPrice}>₹{item.salePrice}</Text>
                    {hasDiscount && (
                      <Text style={styles.mrpTextSmall}>₹{item.baseMRP}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.pAddMini}
                    onPress={() => onAddToCart(item)}
                  >
                    <ShoppingBag size={moderateScale(12)} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.trustBanner}>
          <ShieldCheck size={moderateScale(28)} color="#1E3A8A" />
          <View>
            <Text style={styles.trustTitle}>100% Genuine Spares</Text>
            <Text style={styles.trustSub}>Direct from UMAX Official</Text>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGradient: { paddingBottom: verticalScale(5) },
  logoStyle: {
    width: horizontalScale(100),
    height: verticalScale(50),
    borderRadius: moderateScale(13),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(12),
  },
  headerActions: { flexDirection: 'row', gap: horizontalScale(12) },
  iconCircle: {
    width: horizontalScale(42),
    height: horizontalScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  searchSection: {
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(15),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: moderateScale(16),
    paddingHorizontal: horizontalScale(15),
    height: verticalScale(52),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: horizontalScale(10),
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1E3A8A',
  },
  searchDivider: {
    width: 1,
    height: '50%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: horizontalScale(10),
  },
  scrollBody: { paddingBottom: verticalScale(100) },
  heroContainer: { marginTop: verticalScale(10) },
  heroWrapper: { width: width, paddingHorizontal: horizontalScale(20) },
  heroBannerContainer: {
    width: width - horizontalScale(40),
    height: verticalScale(150),
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  heroImageFull: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
    marginTop: verticalScale(25),
    marginBottom: verticalScale(15),
  },
  secTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#1E3A8A',
  },
  horizontalList: {
    paddingLeft: horizontalScale(20),
    paddingBottom: verticalScale(15),
  },
  productCard: {
    width: horizontalScale(155),
    backgroundColor: '#FFF',
    borderRadius: moderateScale(22),
    marginRight: horizontalScale(15),
    padding: horizontalScale(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
  },
  imageBox: {
    height: verticalScale(115),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pImg: { width: '85%', height: '85%', resizeMode: 'contain' },
  pName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#334155',
    marginTop: verticalScale(12),
  },
  pFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  pPrice: { fontSize: moderateScale(17), fontWeight: '900', color: '#1E3A8A' },
  addBtn: {
    width: horizontalScale(32),
    height: horizontalScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: horizontalScale(20),
    justifyContent: 'space-between',
  },
  similarCard: {
    width: (width - horizontalScale(55)) / 2,
    marginBottom: verticalScale(20),
    backgroundColor: '#FFF',
    borderRadius: moderateScale(22),
    padding: horizontalScale(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
  },
  similarImgBox: {
    height: verticalScale(115),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  similarImg: { width: '80%', height: '80%', resizeMode: 'contain' },
  similarName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#334155',
    marginTop: verticalScale(12),
  },
  similarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(6),
  },
  similarPrice: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#1E3A8A',
  },
  pAddMini: {
    width: horizontalScale(26),
    height: horizontalScale(26),
    borderRadius: moderateScale(8),
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustBanner: {
    margin: horizontalScale(20),
    padding: horizontalScale(20),
    backgroundColor: '#EFF6FF',
    borderRadius: moderateScale(24),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  trustTitle: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#1E3A8A',
  },
  trustSub: { fontSize: moderateScale(12), color: '#3B82F6', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
    padding: moderateScale(4),
  },
  universalBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: horizontalScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  universalText: {
    color: '#FFFFFF',
    fontSize: moderateScale(8),
    fontWeight: '900',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: horizontalScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: moderateScale(8),
    fontWeight: '900',
  },
  mrpText: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
    marginTop: -2,
  },
  mrpTextSmall: {
    fontSize: moderateScale(10),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
});

export default HomeScreens;
