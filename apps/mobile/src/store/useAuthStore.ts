import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  collegeId: string;
  prn?: string;
  department?: string;
  semester?: string;
  employeeId?: string;
  assignedSubjects?: string[];
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  tenantId: string; // 'college-a' (Pushpalata) or 'college-b' (Balasaheb)
  isLoading: boolean;
  setAuth: (token: string, refreshToken: string, user: UserProfile) => Promise<void>;
  setTenantId: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  tenantId: 'college-a', // Default tenant (Pushpalata College)
  isLoading: true,

  setAuth: async (token: string, refreshToken: string, user: UserProfile) => {
    await AsyncStorage.setItem('cc_token', token);
    await AsyncStorage.setItem('cc_refresh_token', refreshToken);
    await AsyncStorage.setItem('cc_user', JSON.stringify(user));
    await AsyncStorage.setItem('cc_tenant_id', user.collegeId || 'college-a');
    set({ token, refreshToken, user, tenantId: user.collegeId || 'college-a' });
  },

  setTenantId: async (tenantId: string) => {
    await AsyncStorage.setItem('cc_tenant_id', tenantId);
    set({ tenantId });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['cc_token', 'cc_refresh_token', 'cc_user']);
    set({ token: null, refreshToken: null, user: null });
  },

  loadSession: async () => {
    try {
      const [token, refreshToken, userJson, tenantId] = await Promise.all([
        AsyncStorage.getItem('cc_token'),
        AsyncStorage.getItem('cc_refresh_token'),
        AsyncStorage.getItem('cc_user'),
        AsyncStorage.getItem('cc_tenant_id'),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({
          token,
          refreshToken,
          user,
          tenantId: tenantId || user.collegeId || 'college-a',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
