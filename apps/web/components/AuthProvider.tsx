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

export const MOCK_USERS: Record<string, User & { password?: string }> = {
  'student@collegea.edu': {
    id: 'usr-student-a',
    email: 'student@collegea.edu',
    name: 'Alex Rivera',
    role: 'STUDENT',
    collegeId: 'college-a',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'student@collegeb.edu': {
    id: 'usr-student-b',
    email: 'student@collegeb.edu',
    name: 'Anish Patil',
    role: 'STUDENT',
    collegeId: 'college-b',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'student@collegec.edu': {
    id: 'usr-student-c',
    email: 'student@collegec.edu',
    name: 'Sneha Redekar',
    role: 'STUDENT',
    collegeId: 'college-c',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'teacher@collegea.edu': {
    id: 'usr-teacher-a',
    email: 'teacher@collegea.edu',
    name: 'Dr. Sarah Jenkins',
    role: 'TEACHER',
    collegeId: 'college-a',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'teacher@collegeb.edu': {
    id: 'usr-teacher-b',
    email: 'teacher@collegeb.edu',
    name: 'Prof. Rajesh Patil',
    role: 'TEACHER',
    collegeId: 'college-b',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'teacher@collegec.edu': {
    id: 'usr-teacher-c',
    email: 'teacher@collegec.edu',
    name: 'Dr. Sneha Patil',
    role: 'TEACHER',
    collegeId: 'college-c',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'admin@collegea.edu': {
    id: 'usr-admin-a',
    email: 'admin@collegea.edu',
    name: 'Admin A',
    role: 'ADMIN',
    collegeId: 'college-a',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'admin@collegeb.edu': {
    id: 'usr-admin-b',
    email: 'admin@collegeb.edu',
    name: 'Admin B',
    role: 'ADMIN',
    collegeId: 'college-b',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'admin@collegec.edu': {
    id: 'usr-admin-c',
    email: 'admin@collegec.edu',
    name: 'Dean Marcus Vance',
    role: 'ADMIN',
    collegeId: 'college-c',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'super@campusconnect.com': {
    id: 'usr-super',
    email: 'super@campusconnect.com',
    name: 'System Administrator',
    role: 'ADMIN',
    collegeId: 'college-a',
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
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

  const login = async (email: string, collegeId: CollegeId, role: UserRole, password?: string): Promise<boolean> => {
    setIsLoading(true);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-college-id': collegeId
        },
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
            studentProfile: apiUser.studentProfile,
            teacherProfile: apiUser.teacherProfile,
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

    // Support logging in registered mock users
    const storedUsers = typeof window !== 'undefined' ? (localStorage.getItem('cc_mock_registered_users') || '[]') : '[]';
    const registeredUsers = JSON.parse(storedUsers);
    const dynamicUsers = registeredUsers.reduce((acc: any, u: any) => {
      acc[u.email.toLowerCase()] = u;
      return acc;
    }, {});

    const matchedUser = MOCK_USERS[email.toLowerCase()] || dynamicUsers[email.toLowerCase()];
    if (matchedUser && matchedUser.collegeId === collegeId && matchedUser.role === role) {
      // Validate password for dynamic users
      if (matchedUser.password && password && matchedUser.password !== password) {
        setIsLoading(false);
        return false;
      }
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
