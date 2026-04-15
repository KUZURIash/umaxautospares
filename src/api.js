// // src/api.js
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const api = axios.create({
//   baseURL: 'https://backend.umaxautospares.com',
//   headers: {
//     'Content-Type': 'application/json',
//     'X-Requested-With': 'XMLHttpRequest', // <--- Add this line
//   },
// });

// api.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('userToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;

// src/api.js
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const api = axios.create({
//   baseURL: 'https://backend.umaxautospares.com',
//   headers: {
//     'Content-Type': 'application/json',
//     'X-Requested-With': 'XMLHttpRequest',
//   },
// });

// // Interceptor to inject the auth token
// api.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('userToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // --- Order API Collection ---

// /**
//  * Get the list of orders
//  * @param {Object} params - { page, limit, status }
//  */
// export const getOrders = (params) => api.get('/orders', { params });

// /**
//  * Get specific order details
//  * @param {string} orderId
//  */
// export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

// /**
//  * Cancel an order
//  * @param {string} orderId
//  * @param {string} reason
//  */
// export const cancelOrder = (orderId, reason) =>
//   api.post(`/orders/${orderId}/cancel`, { reason });

// /**
//  * Initiate Razorpay payment flow
//  * @param {string} orderId
//  */
// export const createRazorpayOrder = (orderId) =>
//   api.post(`/orders/${orderId}/payment`);

// /**
//  * Verify payment signature
//  * @param {string} orderId
//  * @param {Object} paymentData - { razorpayPaymentId, razorpayOrderId, razorpaySignature }
//  */
// export const verifyPayment = (orderId, paymentData) =>
//   api.post(`/orders/${orderId}/verify-payment`, paymentData);

// /**
//  * Download Invoice (PDF)
//  * Note: Use responseType: 'blob' or handle appropriately depending on your file download strategy
//  */
// export const downloadInvoice = (orderId) =>
//   api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });

// export const createOrder = (orderData) => api.post('/orders', orderData);

// export default api;

// track
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const api = axios.create({
//   baseURL: 'https://backend.umaxautospares.com',
//   headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('userToken');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export const getOrders = (params) => api.get('/orders', { params });
// export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);
// export const cancelOrder = (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason });

// export default api;

//combined
// src/api.js
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const api = axios.create({
//   baseURL: 'https://backend.umaxautospares.com',
//   headers: {
//     'Content-Type': 'application/json',
//     'X-Requested-With': 'XMLHttpRequest',
//   },
// });

// api.interceptors.request.use(async (config) => {
//   try {
//     const token = await AsyncStorage.getItem('userToken');
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//   } catch (error) {
//     console.error("Token error:", error);
//   }
//   return config;
// });

// // --- Order & Payment ---
// export const getOrders = (params) => api.get('/orders', { params });
// export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);
// export const createOrder = (orderData) => api.post('/orders', orderData);
// export const cancelOrder = (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason });
// export const createRazorpayOrder = (orderId) => api.post(`/orders/${orderId}/payment`);
// export const verifyPayment = (orderId, data) => api.post(`/orders/${orderId}/verify-payment`, data);
// export const downloadInvoice = (orderId) => api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });

// // --- Wishlist ---
// export const moveToCart = (productId, data) => api.post(`/wishlist/${productId}/move-to-cart`, data);

// // --- Cart (Aligned with CartContext) ---
// export const getCart = () => api.get('/cart');
// export const addToCart = (data) => api.post('/cart/items', data);
// export const updateCartQty = (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity });
// export const removeFromCart = (productId) => api.delete(`/cart/items/${productId}`);
// export const applyCoupon = (code) => api.post('/cart/coupon', { code });

// export default api;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://backend.umaxautospares.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.error('Token error:', error);
  }
  return config;
});

// --- Order & Payment ---
export const getOrders = params => api.get('/orders', { params });
export const getOrderById = orderId => api.get(`/orders/${orderId}`);
export const createOrder = orderData => api.post('/orders', orderData);
export const cancelOrder = (orderId, reason) =>
  api.post(`/orders/${orderId}/cancel`, { reason });
export const createRazorpayOrder = orderId =>
  api.post(`/orders/${orderId}/payment`);
export const verifyPayment = (orderId, data) =>
  api.post(`/orders/${orderId}/verify-payment`, data);
export const downloadInvoice = orderId =>
  api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });

// --- Wishlist ---
export const moveToCart = (productId, data) =>
  api.post(`/wishlist/${productId}/move-to-cart`, data);

// --- Cart (Aligned with CartContext) ---
export const getCart = () => api.get('/cart');
export const addToCart = data => api.post('/cart/items', data);
export const updateCartQty = (productId, quantity) =>
  api.patch(`/cart/items/${productId}`, { quantity });
export const removeFromCart = productId =>
  api.delete(`/cart/items/${productId}`);
export const applyCoupon = code => api.post('/cart/coupon', { code });

// --- User Wallet & Bank Accounts ---
/**
 * Fetches all linked bank accounts for the logged-in user.
 * Matches: GET /users/wallet/accounts
 */
export const getWalletAccounts = () => api.get('/users/wallet/accounts');

/**
 * Links a new bank account to the user's wallet.
 * Matches: POST /users/wallet/accounts
 */
export const linkWalletAccount = data =>
  api.post('/users/wallet/accounts', data);

/**
 * Updates status or primary setting of a specific bank account.
 * Matches: PATCH /users/wallet/accounts/{{walletId}}
 */
export const updateWalletAccount = (walletId, data) =>
  api.patch(`/users/wallet/accounts/${walletId}`, data);

/**
 * Deletes a linked bank account.
 * Matches: DELETE /users/wallet/accounts/{{walletId}}
 */
export const deleteWalletAccount = walletId =>
  api.delete(`/users/wallet/accounts/${walletId}`);

// --- Admin Wallet Management (Newly Added from Postman) ---
/**
 * Admin: Get all wallet accounts across the platform.
 * Supports pagination and search.
 * Matches: GET /users/admin/wallets?page=1&limit=20&search=
 */
export const adminGetAllWallets = params =>
  api.get('/users/admin/wallets', { params });

/**
 * Admin: Get details of a specific user including their wallet accounts.
 * Matches: GET /users/admin/{{userId}}
 */
export const adminGetUserDetails = userId => api.get(`/users/admin/${userId}`);

export default api;
