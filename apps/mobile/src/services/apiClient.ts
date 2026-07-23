import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';

// For Android emulator vs Web/Device dev connection
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }
  return 'http://localhost:4000/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
    // Inject multi-tenant header & mandatory audit platform metadata
    config.headers['x-college-id'] = state.tenantId || 'college-a';
    config.headers['x-platform'] = Platform.OS === 'android' ? 'ANDROID_APP' : 'IOS_APP';
    config.headers['x-device-model'] = Platform.OS;
    config.headers['x-app-version'] = '1.0.0';
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Auto logout on unauthorized token failure
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
