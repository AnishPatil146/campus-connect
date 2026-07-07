'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CollegeId, UserRole } from '@campus-connect/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, collegeId: CollegeId, role: UserRole, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USERS: Record<string, User & { password?: string }> = {};

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

    // Try authenticating with the NestJS API
    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password123' })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data && !payload.data.needsWorkspaceSelection) {
          const apiUser = payload.data.user;
          const loggedUser: User = {
            id: apiUser.id,
            email: apiUser.email,
            name: apiUser.name,
            role: (apiUser.role === 'COLLEGE_ADMIN' || apiUser.role === 'ADMIN') ? 'ADMIN' : apiUser.role,
            collegeId: collegeId, // Keep visual selected collegeId for asset logo mapping
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(loggedUser);
          localStorage.setItem('cc_user', JSON.stringify(loggedUser));
          localStorage.setItem('cc_token', payload.data.accessToken);
          setIsLoading(false);
          return true;
        }
      }
    } catch (e) {
      console.warn('API login failed, falling back to local mocks:', e);
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const matchedUser = MOCK_USERS[email.toLowerCase()];
    if (matchedUser && matchedUser.collegeId === collegeId && matchedUser.role === role) {
      setUser(matchedUser);
      localStorage.setItem('cc_user', JSON.stringify(matchedUser));
      localStorage.setItem('cc_token', 'mock-token-12345');
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
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
