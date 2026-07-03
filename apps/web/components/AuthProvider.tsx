'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CollegeId, UserRole } from '@campus-connect/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, collegeId: CollegeId, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USERS: Record<string, User & { password?: string }> = {
  'student@collegea.edu': {
    id: 'usr-001',
    email: 'student@collegea.edu',
    name: 'Anish',
    role: 'STUDENT',
    collegeId: 'college-a',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: 'password123',
  },
  'teacher@collegeb.edu': {
    id: 'usr-002',
    email: 'teacher@collegeb.edu',
    name: 'Dr. Sarah Jenkins',
    role: 'TEACHER',
    collegeId: 'college-b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: 'password123',
  },
  'admin@collegec.edu': {
    id: 'usr-003',
    email: 'admin@collegec.edu',
    name: 'Dean Marcus Vance',
    role: 'ADMIN',
    collegeId: 'college-c',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: 'password123',
  },
  'super@campusconnect.com': {
    id: 'usr-004',
    email: 'super@campusconnect.com',
    name: 'Super Administrator',
    role: 'SUPER_ADMIN',
    collegeId: 'college-a',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: 'password123',
  },
};

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

  const login = async (email: string, collegeId: CollegeId, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const matchedUser = MOCK_USERS[email.toLowerCase()];
    if (matchedUser && matchedUser.collegeId === collegeId && matchedUser.role === role) {
      setUser(matchedUser);
      localStorage.setItem('cc_user', JSON.stringify(matchedUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cc_user');
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
