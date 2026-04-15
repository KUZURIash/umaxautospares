import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'https://backend.umaxautospares.com/api/v1';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.accessToken = null;
  }

  /**
   * Must be called at app startup to hydrate the session
   */
  async init() {
    this.accessToken = await AsyncStorage.getItem('accessToken');
  }

  async setAccessToken(token) {
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('accessToken', token);
    } else {
      await AsyncStorage.removeItem('accessToken');
    }
  }

  async clearAccessToken() {
    this.accessToken = null;
    await AsyncStorage.removeItem('accessToken');
  }

  async getSessionId() {
    let sessionId = await AsyncStorage.getItem('sessionId');
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!sessionId || !uuidRegex.test(sessionId)) {
      sessionId = uuidv4();
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    // We must await the session ID here
    const sessionId = await this.getSessionId();

    const headers = {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
      headers['Idempotency-Key'] =
        options.idempotencyKey ||
        `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const config = {
      ...options,
      headers,
      // Note: credentials: 'include' is less common in mobile apps
      // since cookies work differently. Only keep if using backend sessions.
      credentials: 'include',
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || 'Request failed');
        error.code = data.error?.code;
        error.statusCode = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      if (
        error.statusCode === 401 &&
        !endpoint.includes('/auth/') &&
        !options._retried
      ) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(endpoint, { ...options, _retried: true });
        }
      }
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        await this.setAccessToken(data.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // --- Wrapper Methods ---
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  async post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }
  async put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }
  async patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // --- Auth ---
  async register(userData) {
    return this.request('/auth/register', { method: 'POST', body: userData });
  }
  async login(email, password, rememberMe = false) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password, rememberMe },
    });
  }
  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }
  async getMe() {
    return this.request('/auth/me');
  }
  async sendOtp(phone) {
    return this.request('/auth/send-otp', { method: 'POST', body: { phone } });
  }
  async verifyOtp(otp) {
    return this.request('/auth/verify-otp', { method: 'POST', body: { otp } });
  }

  // ... [Include all your original Product, Cart, Order, and Admin methods here]
  // ... They will work as-is because they call 'this.request', which is now async.
}

export const api = new ApiClient(API_BASE_URL);
export default api;
