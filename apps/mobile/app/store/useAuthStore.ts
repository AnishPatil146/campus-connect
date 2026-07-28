import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';

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
  tenantId: string;
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
  tenantId: 'college-a',
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
        const storedUser = JSON.parse(userJson);
        set({
          token,
          refreshToken,
          user: storedUser,
          tenantId: tenantId || storedUser.collegeId || 'college-a',
          isLoading: false,
        });

        // Background session revalidation against backend database
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data?.data) {
            const liveUser = res.data.data;
            const updatedProfile: UserProfile = {
              id: liveUser.id,
              email: liveUser.email,
              name: liveUser.name,
              role: liveUser.role,
              collegeId: liveUser.collegeId || tenantId || 'college-a',
              prn: liveUser.prn || storedUser.prn,
              department: liveUser.department?.name || storedUser.department,
              semester: liveUser.semester?.name || storedUser.semester,
              employeeId: liveUser.employeeId || storedUser.employeeId,
              avatarUrl: liveUser.avatarUrl || storedUser.avatarUrl,
            };
            await AsyncStorage.setItem('cc_user', JSON.stringify(updatedProfile));
            set({ user: updatedProfile });
          }
        } catch (authErr) {
          console.warn('Live session revalidation warning, maintaining active local session');
        }
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
