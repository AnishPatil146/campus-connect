'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CollegeId, UserRole } from '@campus-connect/types';

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

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-college-id': collegeId
        },
        body: JSON.stringify({ email, password: password || 'password123', role })
      });
      const payload = await res.json();
      if (res.ok && payload.success && payload.data && !payload.data.needsWorkspaceSelection) {
        const apiUser = payload.data.user;
        const loggedUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: (apiUser.role === 'COLLEGE_ADMIN' || apiUser.role === 'ADMIN') ? 'ADMIN' : apiUser.role,
          collegeId: collegeId, // Keep visual selected collegeId for asset logo mapping
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentProfile: apiUser.studentProfile,
          teacherProfile: apiUser.teacherProfile,
        };
        setUser(loggedUser);
        localStorage.setItem('cc_user', JSON.stringify(loggedUser));
        localStorage.setItem('cc_token', payload.data.accessToken);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        throw new Error(payload.message || 'Invalid credentials');
      }
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  };

  const loginWithGoogle = async (token: string, collegeId: CollegeId, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
    try {
      const res = await fetch(`${apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-college-id': collegeId,
          'x-recaptcha-token': 'mock-recaptcha-token'
        },
        body: JSON.stringify({ token, collegeId, role })
      });
      const payload = await res.json();
      if (res.ok && payload.success && payload.data) {
        const apiUser = payload.data.user;
        const loggedUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: (apiUser.role === 'COLLEGE_ADMIN' || apiUser.role === 'ADMIN') ? 'ADMIN' : apiUser.role,
          collegeId: collegeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentProfile: apiUser.studentProfile,
          teacherProfile: apiUser.teacherProfile,
        };
        setUser(loggedUser);
        localStorage.setItem('cc_user', JSON.stringify(loggedUser));
        localStorage.setItem('cc_token', payload.data.accessToken);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        const err = new Error(payload.message || 'Google login failed') as any;
        err.errorCode = payload.errorCode;
        throw err;
      }
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_token');
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
