import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';

const PROD_API_URL = 'https://campus-connect-tyz7.onrender.com/api/v1';

export const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    // Android emulator reaches host loopback via 10.0.2.2
    return Platform.OS === 'android' ? 'http://10.0.2.2:10000/api/v1' : 'http://localhost:10000/api/v1';
  }
  return PROD_API_URL;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

apiClient.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
    // Inject multi-tenant header & platform audit metadata
    config.headers['x-college-id'] = state.tenantId || 'college-a';
    config.headers['x-platform'] = Platform.OS === 'android' ? 'ANDROID_APP_V2' : 'IOS_APP_V2';
    config.headers['x-device-model'] = Platform.OS;
    config.headers['x-app-version'] = '2.0.0';
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, setAuth, logout, user } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const refreshRes = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = refreshRes.data?.data || {};
          if (accessToken && user) {
            await setAuth(accessToken, newRefresh || refreshToken, user);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          console.warn('[Campus Connect V2] Token refresh failed:', refreshErr);
          await logout();
        }
      } else {
        await logout();
      }
    }
    return Promise.reject(error);
  }
);
