'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CollegeId, UserRole } from '@campus-connect/types';
import { getApiBaseUrl } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, collegeId: CollegeId, role: UserRole, password?: string) => Promise<boolean>;
  loginWithGoogle: (token: string, collegeId: CollegeId, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cc_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('cc_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, collegeId: CollegeId, role: UserRole, password?: string): Promise<boolean> => {
    setIsLoading(true);

    const apiBaseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-college-id': collegeId
        },
        // credentials:'include' ensures the backend's Set-Cookie header (httpOnly) is captured
        credentials: 'include',
        body: JSON.stringify({ email, password: password || 'password123', role })
      });
      const payload = await res.json().catch(() => ({ success: false, message: 'Server response error' }));
      if (res.ok && payload.success && payload.data && !payload.data.needsWorkspaceSelection) {
        const apiUser = payload.data.user;
        const loggedUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: (apiUser.role === 'COLLEGE_ADMIN' || apiUser.role === 'ADMIN') ? 'ADMIN' : apiUser.role,
          collegeId: apiUser.collegeId || collegeId, // Keep visual selected collegeId for asset logo mapping
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentProfile: apiUser.studentProfile,
          teacherProfile: apiUser.teacherProfile,
        };
        setUser(loggedUser);
        localStorage.setItem('cc_user', JSON.stringify(loggedUser));
        localStorage.setItem('cc_token', payload.data.accessToken);
        if (payload.data.refreshToken) {
          localStorage.setItem('cc_refresh_token', payload.data.refreshToken);
        }
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        throw new Error(payload.message || 'Invalid credentials');
      }
    } catch (e: any) {
      setIsLoading(false);
      console.error('[Login Error]', e);
      throw e;
    }
  };

  const loginWithGoogle = async (token: string, collegeId: CollegeId, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-college-id': collegeId,
          'x-recaptcha-token': 'mock-recaptcha-token'
        },
        // credentials:'include' captures the httpOnly cookie set by the backend
        credentials: 'include',
        body: JSON.stringify({ token, collegeId, role })
      });
      const payload = await res.json().catch(() => ({ success: false, message: 'Google authentication error' }));
      if (res.ok && payload.success && payload.data) {
        const apiUser = payload.data.user;
        const loggedUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: (apiUser.role === 'COLLEGE_ADMIN' || apiUser.role === 'ADMIN') ? 'ADMIN' : apiUser.role,
          collegeId: apiUser.collegeId || collegeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentProfile: apiUser.studentProfile,
          teacherProfile: apiUser.teacherProfile,
        };
        setUser(loggedUser);
        localStorage.setItem('cc_user', JSON.stringify(loggedUser));
        localStorage.setItem('cc_token', payload.data.accessToken);
        if (payload.data.refreshToken) {
          localStorage.setItem('cc_refresh_token', payload.data.refreshToken);
        }
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        throw new Error(payload.message || 'Google sign-in failed');
      }
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  };

  const logout = () => {
    // Call backend to invalidate the session and clear the httpOnly cookie
    const apiBaseUrl = getApiBaseUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('cc_token') : null;
    fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    }).catch(() => { /* silent — local state cleared regardless */ });
    setUser(null);
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_refresh_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

