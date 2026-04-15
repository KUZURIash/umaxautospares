import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
} from 'react-native-heroicons/outline';

import { useCart } from './CartContext';

const ProductDetail = ({ route, navigation }) => {
  const { id } = route.params;
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`hhttps://backend.umaxautospares.com/api/v1/products/${id}`),
          fetch(
            `https://backend.umaxautospares.com/api/v1/products/${id}/related`,
          ),
        ]);

        const pData = await pRes.json();
        const rData = await rRes.json();

        if (pData.success) {
          setProduct(pData.data.product);
          setQuantity(pData.data.product.minOrderQuantity || 1);
        }

        if (rData.success) setRelatedProducts(rData.data || []);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(id, quantity);
    setIsAdding(false);
    navigation.navigate('Cart');
  };

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* IMAGE */}
        <View style={styles.imageCard}>
          <Image source={{ uri: product.mainImage }} style={styles.image} />
        </View>

        {/* DETAILS */}
        <View style={styles.content}>
          <Text style={styles.brand}>
            {product.brand?.name || product.brand}
          </Text>

          <Text style={styles.title}>{product.name}</Text>

          {/* PRICE */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.salePrice}</Text>

            {product.baseMRP > product.salePrice && (
              <Text style={styles.mrp}>₹{product.baseMRP}</Text>
            )}
          </View>

          {/* MOQ */}
          <View style={styles.moqBox}>
            <Text style={styles.moqText}>
              Min Order: {product.minOrderQuantity} units
            </Text>
          </View>

          {/* QUANTITY */}
          <View style={styles.qtyBox}>
            <TouchableOpacity
              onPress={() =>
                setQuantity(prev =>
                  Math.max(product.minOrderQuantity, prev - 1),
                )
              }
            >
              <MinusIcon size={20} />
            </TouchableOpacity>

            <Text style={styles.qty}>{quantity}</Text>

            <TouchableOpacity onPress={() => setQuantity(prev => prev + 1)}>
              <PlusIcon size={20} />
            </TouchableOpacity>
          </View>

          {/* RELATED */}
          {relatedProducts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Related Products</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {relatedProducts.map(item => (
                  <Pressable
                    key={item._id}
                    style={styles.relatedCard}
                    onPress={() =>
                      navigation.push('ProductDetail', { id: item._id })
                    }
                  >
                    <Image
                      source={{ uri: item.mainImage }}
                      style={styles.relatedImg}
                    />
                    <Text numberOfLines={1} style={styles.relatedName}>
                      {item.name}
                    </Text>
                    <Text style={styles.relatedPrice}>₹{item.salePrice}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
          {isAdding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ShoppingCartIcon size={20} color="#fff" />
              <Text style={styles.btnText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  imageCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },

  image: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
  },

  content: {
    paddingHorizontal: 20,
  },

  brand: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  price: {
    fontSize: 26,
    fontWeight: '900',
  },

  mrp: {
    marginLeft: 10,
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },

  moqBox: {
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },

  moqText: {
    color: '#EA580C',
    fontWeight: '600',
  },

  qtyBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  qty: {
    fontSize: 16,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 30,
    marginBottom: 10,
  },

  relatedCard: {
    width: 130,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 14,
    marginRight: 10,
  },

  relatedImg: {
    width: '100%',
    height: 80,
    resizeMode: 'contain',
  },

  relatedName: {
    fontSize: 12,
    marginTop: 6,
  },

  relatedPrice: {
    fontWeight: '800',
    marginTop: 4,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
  },

  button: {
    backgroundColor: '#1e3a8a',
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductDetail;
