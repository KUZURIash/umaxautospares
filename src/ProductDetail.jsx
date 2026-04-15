import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Alert, Modal, TextInput, Platform, Dimensions 
} from 'react-native';
import { 
  ShoppingCartIcon, HeartIcon as HeartOutline, 
  MinusIcon, PlusIcon, StarIcon, HandThumbUpIcon, 
  ChevronDownIcon, PencilSquareIcon, TrashIcon, XMarkIcon 
} from "react-native-heroicons/outline";
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from "react-native-heroicons/solid";

// --- CUSTOM IMPORTS ---
import api from './api'; 
import { useCart } from './CartContext'; 
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 

const { width } = Dimensions.get('window');
const MAX_STARS = 5;
const formatPrice = (amount) => `₹${amount?.toLocaleString('en-IN')}`;

const ProductDetail = ({ route, navigation }) => {
  const { id } = route.params; 
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [inputQty, setInputQty] = useState('1');

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');

  const getRatingSummary = () => {
    const summary = { total: reviews.length, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
        if(summary[r.rating] !== undefined) summary[r.rating]++;
    });
    return summary;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productRes, reviewRes, wishlistRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/product/${id}?sort=helpful:-`),
          api.get(`/wishlist`) 
      ]);
      
      if (productRes.data?.success) {
        const p = productRes.data.data.product;
        setProduct(p);
        const minQty = p.minOrderQuantity || 1;
        setQuantity(minQty);
        setInputQty(String(minQty));
      }

      if (wishlistRes.data?.data?.wishlist?.items) {
        const items = wishlistRes.data.data.wishlist.items;
        const found = items.some(item => item.productId?._id === id);
        setIsWishlisted(found);
      }

      if (reviewRes.data?.success) setReviews(reviewRes.data.data || []);

    } catch (err) { 
      console.error("Fetch Data Error:", err.response?.data || err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const updateQty = (newVal) => {
    const min = product?.minOrderQuantity || 1;
    const finalVal = Math.max(min, newVal);
    setQuantity(finalVal);
    setInputQty(String(finalVal));
  };

  const handleManualQtyChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputQty(cleaned);
  };

  const finalizeQty = () => {
    const min = product?.minOrderQuantity || 1;
    const parsed = parseInt(inputQty);
    if (isNaN(parsed) || parsed < min) {
        setQuantity(min);
        setInputQty(String(min));
    } else {
        setQuantity(parsed);
        setInputQty(String(parsed));
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewTitle || !reviewComment) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    try {
      const payload = { productId: id, rating: reviewRating, title: reviewTitle, comment: reviewComment, images: [] };
      if (editingReviewId) await api.put(`/reviews/${editingReviewId}`, payload);
      else await api.post('/reviews', payload);
      
      setReviewModalVisible(false);
      resetReviewForm();
      fetchData();
    } 
    catch (err) { Alert.alert("ThankYou", "Review saved successfully!"); }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          try { await api.delete(`/reviews/${reviewId}`); fetchData(); } 
          catch (err) { Alert.alert("Error", "Could not delete review."); }
      }}
    ]);
  };

  const handleMarkHelpful = async (reviewId) => {
    try { await api.post(`/reviews/${reviewId}/helpful`); fetchData(); } 
    catch (err) { console.error(err); }
  };

  const resetReviewForm = () => {
    setReviewTitle('');
    setReviewComment('');
    setReviewRating(5);
    setEditingReviewId(null);
  };

  const openEditModal = (review) => {
    setEditingReviewId(review._id);
    setReviewTitle(review.title);
    setReviewComment(review.comment);
    setReviewRating(review.rating);
    setReviewModalVisible(true);
  };

  const handleToggleWishlist = async () => {
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);
    try {
      if (previousState) await api.delete(`/wishlist/${id}`);
      else await api.post('/wishlist', { productId: id });
    } catch (err) { setIsWishlisted(previousState); Alert.alert("Error", "Could not update wishlist."); }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      const success = await addToCart(id, quantity);
      if (success) Alert.alert("Success", "Item added to cart!");
    } catch (error) { Alert.alert("Connection Error", "Check your internet connection."); } 
    finally { setIsAdding(false); }
  };

  if (loading || !product) {
      return (
          <SafeScreenWrapper>
              <View style={styles.center}><ActivityIndicator size="large" color="#1e293b" /></View>
          </SafeScreenWrapper>
      );
  }

  const allImages = [product.mainImage, ...(product.images || [])];
  const ratingSum = getRatingSummary();

  return (
    <SafeScreenWrapper backgroundColor="#F6F9FC">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: Gallery */}
        <View style={styles.galleryCard}>
          <Image source={{ uri: allImages[selectedIndex] }} style={styles.mainImage} resizeMode="contain" />
          <View style={styles.thumbnailRow}>
            {allImages.map((img, index) => (
              <TouchableOpacity key={index} onPress={() => setSelectedIndex(index)} style={[styles.thumb, selectedIndex === index && styles.activeThumb]}>
                <Image source={{ uri: img }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 2: Name & Price */}
        <View style={styles.contentSection}>
          <Text style={styles.name}>{product.name}</Text>
          
          <View style={styles.controlsRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.salePrice}>{formatPrice(product.salePrice)}</Text>
              {product.baseMRP > product.salePrice && <Text style={styles.mrp}>{formatPrice(product.baseMRP)}</Text>}
            </View>
            <TouchableOpacity style={styles.heartBtn} onPress={handleToggleWishlist}>
              {isWishlisted ? <HeartSolid size={moderateScale(26)} color="#ef4444" /> : <HeartOutline size={moderateScale(26)} color="#64748b" />}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={[styles.controlsRow, {marginTop: 0}]}>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => updateQty(quantity - 1)}><MinusIcon size={moderateScale(18)} color="#1e293b" /></TouchableOpacity>
              <TextInput 
                style={styles.qtyInput}
                value={inputQty}
                onChangeText={handleManualQtyChange}
                onBlur={finalizeQty}
                onSubmitEditing={finalizeQty}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => updateQty(quantity + 1)}><PlusIcon size={moderateScale(18)} color="#1e293b" /></TouchableOpacity>
            </View>
            <View style={styles.moqBadge}>
                <Text style={styles.moqText}>Min Qty: {product.minOrderQuantity}</Text>
            </View>
          </View>
          <Text style={styles.stockText}>Availability: {product.inventory?.availableStock || 0} in stock</Text>
        </View>

        {/* SECTION 3: Description */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.desc}>{product.description}</Text>
        </View>

        {/* SECTION 4: Reviews Summary */}
        <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.reviewSummaryRow}>
                <View style={styles.bigRatingBox}>
                    <Text style={styles.bigRatingNumber}>{product.averageRating?.toFixed(1) || '0.0'}</Text>
                    <View style={{flexDirection: 'row', gap: horizontalScale(2), marginVertical: verticalScale(4)}}>
                        {[...Array(5)].map((_, i) => <StarSolid key={i} size={moderateScale(16)} color={i < product.averageRating ? "#F59E0B" : "#E5E7EB"} />)}
                    </View>
                    <Text style={styles.subtext}>{reviews.length} total reviews</Text>
                </View>
                <View style={styles.ratingBarsContainer}>
                    {[5,4,3,2,1].map((star) => {
                        const count = ratingSum[star];
                        const percentage = reviews.length > 0 ? (count / reviews.length) : 0;
                        return (
                            <View key={star} style={styles.barRow}>
                                <Text style={styles.barStarNumber}>{star} <StarSolid size={moderateScale(12)} color="#F59E0B" /></Text>
                                <View style={styles.barBackground}>
                                    <View style={[styles.barFill, {width: `${percentage * 100}%`}]} />
                                </View>
                                <Text style={styles.barCountText}>{count}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
            <TouchableOpacity style={styles.writeReviewBtn} onPress={() => { resetReviewForm(); setReviewModalVisible(true); }}>
                <PencilSquareIcon size={moderateScale(20)} color="#fff" />
                <Text style={styles.writeReviewText}>Write a Review</Text>
            </TouchableOpacity>
        </View>

        {/* SECTION 5: Reviews List */}
        <View style={styles.reviewsListSection}>
            <View style={styles.controlsRow}>
                <Text style={styles.smallSectionTitle}>Showing {reviews.length} reviews</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Text style={{fontSize: moderateScale(13), color: '#1e293b', fontWeight: '500'}}>Most Recent</Text>
                    <ChevronDownIcon size={moderateScale(16)} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
                <View style={styles.emptyReviews}>
                    <Text style={{fontSize: moderateScale(14), color: '#94A3B8', textAlign: 'center'}}>No reviews yet.</Text>
                </View>
            ) : (
                reviews.map((rev) => (
                    <View key={rev._id} style={styles.reviewCard}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View>
                                <Text style={styles.reviewerName}>{rev.user?.name || 'Customer'}</Text>
                                <View style={{flexDirection: 'row', marginVertical: verticalScale(4), gap: horizontalScale(2)}}>
                                    {[...Array(5)].map((_, i) => <StarSolid key={i} size={moderateScale(12)} color={i < rev.rating ? "#F59E0B" : "#E5E7EB"} />)}
                                </View>
                            </View>
                            <View style={{flexDirection: 'row', gap: horizontalScale(14)}}>
                                <TouchableOpacity onPress={() => openEditModal(rev)}><PencilSquareIcon size={moderateScale(18)} color="#64748b" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteReview(rev._id)}><TrashIcon size={moderateScale(18)} color="#ef4444" /></TouchableOpacity>
                            </View>
                        </View>
                        <Text style={styles.reviewTitleText}>{rev.title}</Text>
                        <Text style={styles.reviewText}>{rev.comment}</Text>
                        {/* FIXED: Changed <div> to <View> below */}
                        <View style={styles.dividerLight} />
                        <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10)}} onPress={() => handleMarkHelpful(rev._id)}>
                            <HandThumbUpIcon size={moderateScale(16)} color="#64748b" />
                            <Text style={{fontSize: moderateScale(12), color: '#64748b', marginLeft: horizontalScale(6)}}>Helpful ({rev.helpfulCount || 0})</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cartBtn, isAdding && { opacity: 0.7 }]} onPress={handleAddToCart} disabled={isAdding}>
          {isAdding ? <ActivityIndicator color="#fff" /> : <><ShoppingCartIcon size={moderateScale(20)} color="#fff" /><Text style={styles.cartText}>Add to Cart</Text></>}
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal visible={reviewModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(15)}}>
                    <Text style={styles.modalTitle}>{editingReviewId ? "Update Your Review" : "Rate this Product"}</Text>
                    <TouchableOpacity onPress={() => setReviewModalVisible(false)}><XMarkIcon size={moderateScale(24)} color="#1e293b" /></TouchableOpacity>
                </View>
                <View style={styles.modalRatingRow}>
                    {[1,2,3,4,5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{padding: moderateScale(5)}}>
                            <StarSolid size={moderateScale(38)} color={star <= reviewRating ? "#F59E0B" : "#E5E7EB"} />
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput placeholder="Review Title" style={styles.input} value={reviewTitle} onChangeText={setReviewTitle} placeholderTextColor="#94A3B8" />
                <TextInput placeholder="Detailed feedback..." style={[styles.input, {height: verticalScale(120), textAlignVertical: 'top'}]} multiline value={reviewComment} onChangeText={setReviewComment} placeholderTextColor="#94A3B8" />
                <View style={{flexDirection: 'row', gap: horizontalScale(12), marginTop: verticalScale(10)}}>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#F1F5F9'}]} onPress={() => setReviewModalVisible(false)}><Text style={{color: '#1e293b', fontWeight: '600'}}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#111827'}]} onPress={handleReviewSubmit}><Text style={{color: '#fff', fontWeight: '600'}}>Submit Review</Text></TouchableOpacity>
                </View>
              </View>
          </View>
      </Modal>
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: verticalScale(120) },
  galleryCard: { backgroundColor: '#FFFFFF', padding: moderateScale(20), borderBottomLeftRadius: moderateScale(30), borderBottomRightRadius: moderateScale(30), elevation: 4 },
  mainImage: { width: '100%', height: verticalScale(280) },
  thumbnailRow: { flexDirection: 'row', marginTop: verticalScale(18), justifyContent: 'center', gap: horizontalScale(12) },
  thumb: { width: horizontalScale(52), height: horizontalScale(52), borderWidth: 1, borderColor: '#E2E8F0', borderRadius: moderateScale(12), overflow: 'hidden' },
  activeThumb: { borderColor: '#2563EB', borderWidth: 2 },
  thumbImage: { width: '100%', height: '100%' },
  contentSection: { padding: moderateScale(20), backgroundColor: '#fff', marginVertical: verticalScale(14), marginHorizontal: horizontalScale(12), borderRadius: moderateScale(20) },
  name: { fontSize: moderateScale(22), fontWeight: '800', color: '#1e293b', lineHeight: moderateScale(28) },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: horizontalScale(14) },
  priceContainer: { flexDirection: 'row', alignItems: 'flex-end', flex: 1 },
  salePrice: { fontSize: moderateScale(28), fontWeight: '900', color: '#111827', marginRight: horizontalScale(10) },
  mrp: { fontSize: moderateScale(16), color: '#94A3B8', textDecorationLine: 'line-through' },
  heartBtn: { height: horizontalScale(48), width: horizontalScale(48), justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: moderateScale(12) },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: verticalScale(18) },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: moderateScale(12), width: horizontalScale(130), height: verticalScale(48) },
  stepBtn: { paddingHorizontal: horizontalScale(16), height: '100%', justifyContent: 'center' },
  qtyInput: { fontSize: moderateScale(16), fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#0F172A', padding: 0 },
  moqBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: horizontalScale(12), height: verticalScale(40), borderRadius: moderateScale(10), justifyContent: 'center' },
  moqText: { color: '#C2410C', fontWeight: '700', fontSize: moderateScale(12) },
  stockText: { fontSize: moderateScale(13), fontWeight: '600', color: '#64748b', marginTop: verticalScale(12) },
  cardSection: { backgroundColor: '#fff', marginHorizontal: horizontalScale(12), borderRadius: moderateScale(20), padding: moderateScale(20), marginBottom: verticalScale(14) },
  sectionTitle: { fontSize: moderateScale(18), fontWeight: '800', color: '#1e293b', marginBottom: verticalScale(15) },
  desc: { color: '#475569', fontSize: moderateScale(15), lineHeight: moderateScale(24) },
  reviewSummaryRow: { flexDirection: 'row', gap: horizontalScale(20), alignItems: 'center' },
  bigRatingBox: { width: horizontalScale(110), alignItems: 'center' },
  bigRatingNumber: { fontSize: moderateScale(50), fontWeight: '900', color: '#111827' },
  subtext: { color: '#94A3B8', fontSize: moderateScale(12) },
  ratingBarsContainer: { flex: 1, gap: verticalScale(4) },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: horizontalScale(6) },
  barStarNumber: { width: horizontalScale(30), fontSize: moderateScale(13), fontWeight: '600', color: '#475569' },
  barBackground: { flex: 1, height: verticalScale(6), backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F59E0B' },
  barCountText: { width: horizontalScale(25), fontSize: moderateScale(12), color: '#94A3B8', textAlign: 'right' },
  writeReviewBtn: { backgroundColor: '#111827', flexDirection: 'row', padding: moderateScale(16), borderRadius: moderateScale(14), marginTop: verticalScale(20), justifyContent: 'center', alignItems: 'center', gap: horizontalScale(10) },
  writeReviewText: { color: '#fff', fontWeight: '700', fontSize: moderateScale(15) },
  reviewsListSection: { paddingHorizontal: horizontalScale(12) },
  smallSectionTitle: { fontSize: moderateScale(16), fontWeight: '700', color: '#64748b' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: horizontalScale(6), backgroundColor: '#fff', paddingHorizontal: horizontalScale(12), height: verticalScale(36), borderRadius: moderateScale(10) },
  emptyReviews: { backgroundColor: '#fff', padding: moderateScale(30), borderRadius: moderateScale(16), marginTop: verticalScale(10) },
  reviewCard: { backgroundColor: '#FFFFFF', padding: moderateScale(18), borderRadius: moderateScale(16), marginBottom: verticalScale(10) },
  reviewerName: { fontWeight: '700', fontSize: moderateScale(15), color: '#1e293b' },
  reviewTitleText: { fontWeight: '800', fontSize: moderateScale(14), color: '#1e293b', marginVertical: verticalScale(6) },
  reviewText: { fontSize: moderateScale(14), color: '#475569', lineHeight: moderateScale(22) },
  dividerLight: { height: 1, backgroundColor: '#F1F5F9', marginTop: verticalScale(14) },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: moderateScale(16), backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E2E8F0', paddingBottom: Platform.OS === 'ios' ? verticalScale(30) : verticalScale(16) },
  cartBtn: { backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: verticalScale(56), borderRadius: moderateScale(14), gap: horizontalScale(10) },
  cartText: { color: '#FFFFFF', fontSize: moderateScale(17), fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: moderateScale(20) },
  modalContent: { backgroundColor: '#fff', borderRadius: moderateScale(24), padding: moderateScale(24) },
  modalTitle: { fontSize: moderateScale(20), fontWeight: '800', color: '#1e293b' },
  modalRatingRow: { flexDirection: 'row', gap: horizontalScale(5), marginVertical: verticalScale(20), justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#F6F9FC', borderRadius: moderateScale(12), padding: moderateScale(16), fontSize: moderateScale(15), color: '#1e293b', marginBottom: verticalScale(15) },
  modalBtn: { flex: 1, height: verticalScale(50), borderRadius: moderateScale(12), alignItems: 'center', justifyContent: 'center' }
});

export default ProductDetail;