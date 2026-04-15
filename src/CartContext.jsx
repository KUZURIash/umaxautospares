// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import api from './api';

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [cartData, setCartData] = useState({ 
//     subtotal: 0, 
//     total: 0, 
//     shippingCost: 0, 
//     couponDiscount: 0 
//   });
//   const [loading, setLoading] = useState(false);

//   const fetchCart = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await api.get('/cart');
//       if (res.data?.success) {
//         setCartItems(res.data.data.cart.items || []);
//         setCartData(res.data.data.cart || {});
//       }
//     } catch (err) {
//       console.error("Failed to fetch cart:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --- NEW: WISHLIST INTEGRATION ---
//   const moveToCart = async (productId) => {
//     if (!productId) {
//       console.error("MoveToCart Error: No productId provided.");
//       return { success: false, message: "No product ID" };
//     }

//     setLoading(true);
//     try {
//       // Sending request to: /api/v1/wishlist/:productId/move-to-cart
//       await api.post(`/wishlist/${productId}/move-to-cart`, {
//         variantSku: null,
//         quantity: 1
//       });
      
//       await fetchCart(); // Refresh cart global state
//       return { success: true };
//     } catch (err) {
//       // This will log the specific backend error in your console
//       console.error("Move to cart failed. Error details:", err.response?.data || err.message);
//       return { success: false, message: err.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addToCart = async (productId, quantity) => {
//     setLoading(true);
//     try {
//       await api.post('/cart/items', { productId, quantity });
//       await fetchCart(); 
//       return true;
//     } catch (err) {
//       console.error("Add to cart failed:", err);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateQuantity = async (productId, quantity) => {
//     setLoading(true);
//     try {
//       await api.patch(`/cart/items/${productId}`, { quantity });
//       await fetchCart();
//     } catch (err) {
//       console.error("Update quantity failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     setLoading(true);
//     try {
//       await api.delete(`/cart/items/${productId}`);
//       await fetchCart();
//     } catch (err) {
//       console.error("Remove item failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const applyCoupon = async (code) => {
//     setLoading(true);
//     try {
//       await api.post('/cart/coupon', { code });
//       await fetchCart();
//     } catch (err) {
//       console.error("Coupon application failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { 
//     fetchCart(); 
//   }, [fetchCart]);

//   return (
//     <CartContext.Provider 
//       value={{ 
//         cartItems, 
//         cartData, 
//         loading, 
//         updateQuantity, 
//         removeFromCart, 
//         applyCoupon, 
//         fetchCart, 
//         addToCart,
//         moveToCart
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);


//NEW 

// src/contexts/CartContext.jsx
// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { Alert } from 'react-native'; 
// import api from './api'; 

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [cartData, setCartData] = useState({ 
//     subtotal: 0, 
//     total: 0, 
//     shippingCost: 0, 
//     couponDiscount: 0 
//   });
//   const [loading, setLoading] = useState(false);

//   const fetchCart = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await api.get('/cart');
//       if (res.data?.success) {
//         const cart = res.data.data.cart || res.data.data;
//         setCartItems(cart.items || []);
//         setCartData(cart || {});
//       }
//     } catch (err) {
//       console.error("Failed to fetch cart:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --- NEW: Clear Cart Function ---
//   const clearCart = useCallback(() => {
//     // We clear the local state immediately so the UI (Cart badge/List) 
//     // updates without waiting for a network request.
//     setCartItems([]);
//     setCartData({ 
//       subtotal: 0, 
//       total: 0, 
//       shippingCost: 0, 
//       couponDiscount: 0 
//     });
    
//     // Note: Usually, the backend clears the cart automatically 
//     // when an order is successfully placed. 
//     // If you need to manually tell the server to clear it, add:
//     // await api.delete('/cart'); 
//   }, []);

//   const moveToCart = async (productId) => {
//     if (!productId) return { success: false, message: "No product ID" };
//     setLoading(true);
//     try {
//       await api.post(`/wishlist/${productId}/move-to-cart`, {
//         variantSku: null,
//         quantity: 1
//       });
//       await fetchCart();
//       return { success: true };
//     } catch (err) {
//       const msg = err.response?.data?.message || "Move to cart failed";
//       Alert.alert("Action Failed", msg);
//       return { success: false, message: msg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addToCart = async (productId, quantity) => {
//     setLoading(true);
//     try {
//       await api.post('/cart/items', { productId, quantity });
//       await fetchCart(); 
//       return true;
//     } catch (err) {
//       const msg = err.response?.data?.message || "Add to cart failed";
//       Alert.alert("Notice", msg);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateQuantity = async (productId, quantity) => {
//     if (!productId) return;
//     setLoading(true);
//     try {
//       await api.patch(`/cart/items/${productId}`, { quantity });
//       await fetchCart();
//     } catch (err) {
//       const serverMessage = err.response?.data?.message || "Could not update cart";
//       if (err.response?.status === 400 || err.response?.status === 403) {
//         Alert.alert("Cart Locked", serverMessage);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     if (!productId) return;
//     setLoading(true);
//     try {
//       await api.delete(`/cart/items/${productId}`);
//       await fetchCart();
//     } catch (err) {
//       const msg = err.response?.data?.message || "Remove item failed";
//       Alert.alert("Notice", msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const applyCoupon = async (code) => {
//     setLoading(true);
//     try {
//       await api.post('/cart/coupon', { code });
//       await fetchCart();
//       return { success: true };
//     } catch (err) {
//       const msg = err.response?.data?.message || "Invalid Coupon";
//       return { success: false, message: msg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { 
//     fetchCart(); 
//   }, [fetchCart]);

//   return (
//     <CartContext.Provider 
//       value={{ 
//         cartItems, 
//         cartData, 
//         loading, 
//         updateQuantity, 
//         removeFromCart, 
//         applyCoupon, 
//         fetchCart, 
//         addToCart,
//         moveToCart,
//         clearCart // <-- Exporting clearCart here
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);
// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { Alert, ToastAndroid, Platform } from 'react-native'; 
// import api from './api'; 

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [cartData, setCartData] = useState({ 
//     subtotal: 0, 
//     total: 0, 
//     shippingCost: 0, 
//     couponDiscount: 0 
//   });
//   const [loading, setLoading] = useState(false);

//   // --- HELPER: Toast Feedback ---
//   const showToast = (message) => {
//     if (Platform.OS === 'android') {
//       ToastAndroid.show(message, ToastAndroid.SHORT);
//     } else {
//       // iOS doesn't have a native Toast like Android. 
//       // You can use a library like react-native-root-toast here, 
//       // or a simple Alert fallback.
//       console.log("Toast:", message);
//     }
//   };

//   // --- FETCH CART ---
//   const fetchCart = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await api.get('/cart');
//       if (res.data?.success) {
//         const cart = res.data.data.cart || res.data.data;
//         setCartItems(cart.items || []);
//         setCartData(cart || {});
//       }
//     } catch (err) {
//       console.error("Failed to fetch cart:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --- CLEAR CART ---
//   const clearCart = useCallback(() => {
//     setCartItems([]);
//     setCartData({ 
//       subtotal: 0, 
//       total: 0, 
//       shippingCost: 0, 
//       couponDiscount: 0 
//     });
//   }, []);

//   // --- MOVE FROM WISHLIST TO CART ---
//   const moveToCart = async (productId, productName = "Item") => {
//     if (!productId) return { success: false, message: "No product ID" };
//     setLoading(true);
//     try {
//       await api.post(`/wishlist/${productId}/move-to-cart`, {
//         variantSku: null,
//         quantity: 1
//       });
//       await fetchCart();
//       showToast(`${productName} moved to cart!`);
//       return { success: true };
//     } catch (err) {
//       const msg = err.response?.data?.message || "Move to cart failed";
//       Alert.alert("Action Failed", msg);
//       return { success: false, message: msg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- ADD TO CART (With Toast) ---
//   const addToCart = async (productId, quantity, productName = "Item") => {
//     setLoading(true);
//     try {
//       await api.post('/cart/items', { productId, quantity });
//       await fetchCart(); 
      
//       // SUCCESS FEEDBACK
//       showToast(`${productName} added to cart!`);
      
//       return true;
//     } catch (err) {
//       const msg = err.response?.data?.message || "Add to cart failed";
//       Alert.alert("Notice", msg);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- UPDATE QUANTITY ---
//   const updateQuantity = async (productId, quantity) => {
//     if (!productId) return;
//     setLoading(true);
//     try {
//       await api.patch(`/cart/items/${productId}`, { quantity });
//       await fetchCart();
//     } catch (err) {
//       const serverMessage = err.response?.data?.message || "Could not update cart";
//       if (err.response?.status === 400 || err.response?.status === 403) {
//         Alert.alert("Cart Locked", serverMessage);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- REMOVE FROM CART ---
//   const removeFromCart = async (productId) => {
//     if (!productId) return;
//     setLoading(true);
//     try {
//       await api.delete(`/cart/items/${productId}`);
//       await fetchCart();
//       showToast("Item removed");
//     } catch (err) {
//       const msg = err.response?.data?.message || "Remove item failed";
//       Alert.alert("Notice", msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- APPLY COUPON ---
//   const applyCoupon = async (code) => {
//     setLoading(true);
//     try {
//       await api.post('/cart/coupon', { code });
//       await fetchCart();
//       showToast("Coupon Applied!");
//       return { success: true };
//     } catch (err) {
//       const msg = err.response?.data?.message || "Invalid Coupon";
//       return { success: false, message: msg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { 
//     fetchCart(); 
//   }, [fetchCart]);

//   return (
//     <CartContext.Provider 
//       value={{ 
//         cartItems, 
//         cartData, 
//         loading, 
//         updateQuantity, 
//         removeFromCart, 
//         applyCoupon, 
//         fetchCart, 
//         addToCart,
//         moveToCart,
//         clearCart 
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);





// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { Alert, ToastAndroid, Platform } from 'react-native'; 
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import api from './api'; 

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [cartData, setCartData] = useState({ 
//     subtotal: 0, 
//     total: 0, 
//     shippingCost: 0, 
//     couponDiscount: 0 
//   });
//   const [loading, setLoading] = useState(false);

//   // --- HELPER: Toast Feedback ---
//   const showToast = (message) => {
//     if (Platform.OS === 'android') {
//       ToastAndroid.show(message, ToastAndroid.SHORT);
//     } else {
//       console.log("Toast:", message);
//     }
//   };

//   // --- FETCH CART ---
//   const fetchCart = useCallback(async () => {
//     // 1. Check for token first to prevent the "userId required" console error
//     const token = await AsyncStorage.getItem('userToken');
//     if (!token) {
//       console.log("No token found, skipping fetchCart.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await api.get('/cart');
//       if (res.data?.success) {
//         // Handle different backend response structures
//         const cart = res.data.data.cart || res.data.data;
//         setCartItems(cart.items || []);
//         setCartData(cart || {});
//       }
//     } catch (err) {
//       // 2. Log only significant errors
//       console.error("Failed to fetch cart:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --- CLEAR CART (Call this during Logout) ---
//   const clearCart = useCallback(async () => {
//     setCartItems([]);
//     setCartData({ 
//       subtotal: 0, 
//       total: 0, 
//       shippingCost: 0, 
//       couponDiscount: 0 
//     });
//   }, []);

//   // --- MOVE FROM WISHLIST TO CART ---
//   const moveToCart = async (productId, productName = "Item") => {
//     if (!productId) return { success: false, message: "No product ID" };
//     setLoading(true);
//     try {
//       await api.post(`/wishlist/${productId}/move-to-cart`, {
//         variantSku: null,
//         quantity: 1
//       });
//       await fetchCart();
//       showToast(`${productName} moved to cart!`);
//       return { success: true };
//     } catch (err) {
//       const msg = err.response?.data?.message || "Move to cart failed";
//       Alert.alert("Action Failed", msg);
//       return { success: false, message: msg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- ADD TO CART ---
//   const addToCart = async (productId, quantity, productName = "Item") => {
//     setLoading(true);
//     try {
//       await api.post('/cart/items', { productId, quantity });
//       await fetchCart(); 
//       showToast(`${productName} added to cart!`);
//       return true;
//     } catch (err) {
//       const msg = err.response?.data?.message || "Add to cart failed";
//       Alert.alert("Notice", msg);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- UPDATE QUANTITY ---
//   const updateQuantity = async (productId, quantity) => {
//     if (!productId) return;
//     setLoading(true);
//     try {
//       await api.patch(`/cart/items/${productId}`, { quantity });
//       await fetchCart();
//     } catch (err) {
//       const serverMessage = err.response?.data?.message || "Could not update cart";
//       if (err.response?.status === 400 || err.response?.status === 403) {
//         Alert.alert("Cart Locked", serverMessage);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- REMOVE FROM CART ---
//   const removeFromCart = async (productId) => {
//     if (!productId) return;
//     setLoading(true);
//     try {
//       await api.delete(`/cart/items/${productId}`);
//       await fetchCart();
//       showToast("Item removed");
//     } catch (err) {
//       const msg = err.response?.data?.message || "Remove item failed";
//       Alert.alert("Notice", msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- APPLY COUPON ---
//   const applyCoupon = async (code) => {
//     setLoading(true);
//     try {
//       await api.post('/cart/coupon', { code });
//       await fetchCart();
//       showToast("Coupon Applied!");
//       return { success: true };
//     } catch (err) {
//       const msg = err.response?.data?.message || "Invalid Coupon";
//       return { success: false, message: msg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 3. Initial load on app mount
//   useEffect(() => { 
//     fetchCart(); 
//   }, [fetchCart]);

//   return (
//     <CartContext.Provider 
//       value={{ 
//         cartItems, 
//         cartData, 
//         loading, 
//         updateQuantity, 
//         removeFromCart, 
//         applyCoupon, 
//         fetchCart, 
//         addToCart,
//         moveToCart,
//         clearCart 
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);




import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, ToastAndroid, Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api'; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartData, setCartData] = useState({ 
    subtotal: 0, 
    total: 0, 
    shippingCost: 0, 
    couponDiscount: 0 
  });
  const [loading, setLoading] = useState(false);

  // --- 1. Fetch Cart Logic ---
  const fetchCart = useCallback(async (tokenOverride = null) => {
    const token = tokenOverride || await AsyncStorage.getItem('userToken');
    if (!token) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("[CartContext] API Data:", JSON.stringify(res.data, null, 2));

      if (res.data) {
        const root = res.data.data || res.data;
        const cart = root.cart || root;
        const items = cart.items || cart.products || cart.cartItems || [];
        
        setCartItems(items);
        setCartData(cart);
      }
    } catch (err) {
      console.error("[CartContext] Fetch Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. Add to Cart ---
  const addToCart = async (productId, quantity, productName = "Item") => {
    setLoading(true);
    try {
      await api.post('/cart/items', { productId, quantity });
      await fetchCart();
      return true;
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Out of Stock");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Update Quantity (THE MISSING FUNCTION) ---
  const updateQuantity = async (productId, quantity) => {
  if (!productId || quantity < 1) return;
  setLoading(true);
  try {
    await api.patch(`/cart/items/${productId}`, { quantity });
    await fetchCart();
  } catch (err) {
    // Keep your alert here
    Alert.alert("Update Failed", err.response?.data?.message || "Error updating quantity");
    
    // --- ADD THIS LINE ---
    // This allows the CartScreen to catch the error and reset the UI
    throw err; 
  } finally {
    setLoading(false);
  }
};

  // --- 4. Remove from Cart ---
  const removeFromCart = async (productId) => {
    setLoading(true);
    try {
      await api.delete(`/cart/items/${productId}`);
      await fetchCart();
    } catch (err) {
      Alert.alert("Error", "Could not remove item");
    } finally {
      setLoading(false);
    }
  };

  // --- 5. Apply Coupon ---
  const applyCoupon = async (code) => {
    setLoading(true);
    try {
      await api.post('/cart/coupon', { code });
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Invalid coupon" };
    } finally {
      setLoading(false);
    }
  };

  // --- 6. Clear Cart ---
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartData({ subtotal: 0, total: 0, shippingCost: 0, couponDiscount: 0 });
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        cartData, 
        loading, 
        fetchCart, 
        addToCart, 
        updateQuantity, // Now correctly defined!
        removeFromCart, 
        applyCoupon,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);