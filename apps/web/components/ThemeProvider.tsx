'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  role: 'student' | 'teacher' | 'admin' | null;
  setRole: (role: 'student' | 'teacher' | 'admin' | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [role, setRoleState] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const pathname = usePathname();

  const setRole = (newRole: 'student' | 'teacher' | 'admin' | null) => {
    setRoleState(newRole);
    if (typeof document !== 'undefined') {
      if (newRole) {
        document.documentElement.setAttribute('data-role', newRole);
      } else {
        document.documentElement.removeAttribute('data-role');
      }
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Automatic pathname-based role synchronization
  useEffect(() => {
    let detectedRole: 'student' | 'teacher' | 'admin' | null = null;
    const path = pathname || '';
    if (path.includes('/student') || path.includes('/dashboard/student')) {
      detectedRole = 'student';
    } else if (path.includes('/teacher') || path.includes('/dashboard/teacher')) {
      detectedRole = 'teacher';
    } else if (path.includes('/admin') || path.includes('/dashboard/admin')) {
      detectedRole = 'admin';
    } else {
      try {
        const storedUser = localStorage.getItem('cc_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u && u.role) {
            detectedRole = u.role.toLowerCase() as any;
          }
        }
      } catch (_) {}
    }
    if (detectedRole) {
      setRole(detectedRole);
    }
  }, [pathname]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, role, setRole }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
