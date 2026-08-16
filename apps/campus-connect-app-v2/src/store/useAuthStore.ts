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
  phone?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  tenantId: string;
  isLoading: boolean;
  setAuth: (token: string, refreshToken: string, user: UserProfile) => Promise<void>;
  setTenantId: (tenantId: string) => Promise<void>;
  updateUser: (partial: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const decodeJwtToken = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = '';
    for (let i = 0; i < base64.length; i += 4) {
      const a = chars.indexOf(base64.charAt(i));
      const b = chars.indexOf(base64.charAt(i + 1));
      const c = chars.indexOf(base64.charAt(i + 2));
      const d = chars.indexOf(base64.charAt(i + 3));
      const bitmap = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
      if (c === 64) str += String.fromCharCode((bitmap >> 16) & 255);
      else if (d === 64) str += String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255);
      else str += String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255, bitmap & 255);
    }
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  tenantId: 'college-a',
  isLoading: true,

  setAuth: async (token: string, refreshToken: string, user: UserProfile) => {
    const decoded = decodeJwtToken(token);
    const validatedRole = (decoded?.role || user.role) as 'STUDENT' | 'TEACHER' | 'ADMIN';
    const validatedUser: UserProfile = {
      ...user,
      role: validatedRole,
      id: decoded?.sub || decoded?.userId || user.id,
      email: decoded?.email || user.email,
    };

    const targetTenant = validatedUser.collegeId || 'college-a';

    await AsyncStorage.setItem('cc_v2_token', token);
    await AsyncStorage.setItem('cc_v2_refresh_token', refreshToken);
    await AsyncStorage.setItem('cc_v2_user', JSON.stringify(validatedUser));
    await AsyncStorage.setItem('cc_v2_tenant_id', targetTenant);

    set({
      token,
      refreshToken,
      user: validatedUser,
      tenantId: targetTenant,
    });
  },

  setTenantId: async (tenantId: string) => {
    await AsyncStorage.setItem('cc_v2_tenant_id', tenantId);
    set({ tenantId });
  },

  updateUser: async (partial: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updated = { ...currentUser, ...partial };
    await AsyncStorage.setItem('cc_v2_user', JSON.stringify(updated));
    set({ user: updated });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['cc_v2_token', 'cc_v2_refresh_token', 'cc_v2_user']);
    set({ token: null, refreshToken: null, user: null });
  },

  loadSession: async () => {
    const safetyTimer = setTimeout(() => {
      set((state) => (state.isLoading ? { isLoading: false } : state));
    }, 1500);

    try {
      const [token, refreshToken, userJson, tenantId] = await Promise.all([
        AsyncStorage.getItem('cc_v2_token'),
        AsyncStorage.getItem('cc_v2_refresh_token'),
        AsyncStorage.getItem('cc_v2_user'),
        AsyncStorage.getItem('cc_v2_tenant_id'),
      ]);

      if (token && userJson) {
        let storedUser: UserProfile | null = null;
        try {
          storedUser = JSON.parse(userJson);
        } catch (_) {}

        if (storedUser) {
          set({
            token,
            refreshToken,
            user: storedUser,
            tenantId: tenantId || storedUser.collegeId || 'college-a',
            isLoading: false,
          });

          // Background revalidation
          apiClient
            .get('/auth/me')
            .then(async (res) => {
              if (res.data?.data) {
                const liveUser = res.data.data;
                const updatedProfile: UserProfile = {
                  id: liveUser.id,
                  email: liveUser.email,
                  name: liveUser.name,
                  role: liveUser.role,
                  collegeId: liveUser.collegeId || tenantId || 'college-a',
                  prn: liveUser.prn || storedUser?.prn,
                  department: liveUser.department?.name || liveUser.department || storedUser?.department,
                  semester: liveUser.semester?.name || liveUser.semester || storedUser?.semester,
                  employeeId: liveUser.employeeId || storedUser?.employeeId,
                  avatarUrl: liveUser.avatarUrl || storedUser?.avatarUrl,
                  phone: liveUser.phone || storedUser?.phone,
                };
                await AsyncStorage.setItem('cc_v2_user', JSON.stringify(updatedProfile));
                set({ user: updatedProfile });
              }
            })
            .catch(async (err) => {
              if (err?.response?.status === 401 || err?.response?.status === 403) {
                await AsyncStorage.multiRemove(['cc_v2_token', 'cc_v2_refresh_token', 'cc_v2_user']);
                set({ token: null, refreshToken: null, user: null });
              }
            });
        } else {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    } finally {
      clearTimeout(safetyTimer);
      set({ isLoading: false });
    }
  },
}));
