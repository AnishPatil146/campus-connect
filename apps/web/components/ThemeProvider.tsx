'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type RoleType = 'student' | 'teacher' | 'admin';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  role: RoleType | null;
  setRole: (role: RoleType | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const roleThemeVars: Record<RoleType, { light: Record<string, string>; dark: Record<string, string> }> = {
  student: {
    light: {
      '--role-primary': '#2563EB',
      '--role-secondary': '#3B82F6',
      '--role-tertiary': '#60A5FA',
      '--role-bg': '#F8FAFC',
      '--role-sidebar-bg': '#FFFFFF',
      '--role-header-bg': '#FFFFFF',
      '--role-card-bg': '#FFFFFF',
      '--role-border': '#E2E8F0',
      '--role-surface': '#EFF6FF',
      '--role-surface-hover': '#DBEAFE',
      '--role-login-from': '#02225B',
      '--role-login-to': '#0A3B8B',
      '--role-login-glow': '#3B82F6',
    },
    dark: {
      '--role-primary': '#3B82F6',
      '--role-secondary': '#60A5FA',
      '--role-tertiary': '#93C5FD',
      '--role-bg': '#0B0F19',
      '--role-sidebar-bg': '#0F172A',
      '--role-header-bg': '#0F172A',
      '--role-card-bg': '#131B2E',
      '--role-border': '#1E293B',
      '--role-surface': 'rgba(59, 130, 246, 0.12)',
      '--role-surface-hover': 'rgba(59, 130, 246, 0.22)',
      '--role-login-from': '#0F172A',
      '--role-login-to': '#1E3A8A',
      '--role-login-glow': '#3B82F6',
    },
  },
  teacher: {
    light: {
      '--role-primary': '#059669',
      '--role-secondary': '#10B981',
      '--role-tertiary': '#34D399',
      '--role-bg': '#F8FAFC',
      '--role-sidebar-bg': '#FFFFFF',
      '--role-header-bg': '#FFFFFF',
      '--role-card-bg': '#FFFFFF',
      '--role-border': '#E2E8F0',
      '--role-surface': '#ECFDF5',
      '--role-surface-hover': '#D1FAE5',
      '--role-login-from': '#044E37',
      '--role-login-to': '#059669',
      '--role-login-glow': '#10B981',
    },
    dark: {
      '--role-primary': '#10B981',
      '--role-secondary': '#34D399',
      '--role-tertiary': '#6EE7B7',
      '--role-bg': '#0B0F19',
      '--role-sidebar-bg': '#0F172A',
      '--role-header-bg': '#0F172A',
      '--role-card-bg': '#131B2E',
      '--role-border': '#1E293B',
      '--role-surface': 'rgba(16, 185, 129, 0.12)',
      '--role-surface-hover': 'rgba(16, 185, 129, 0.22)',
      '--role-login-from': '#052E16',
      '--role-login-to': '#166534',
      '--role-login-glow': '#10B981',
    },
  },
  admin: {
    light: {
      '--role-primary': '#7C3AED',
      '--role-secondary': '#8B5CF6',
      '--role-tertiary': '#A78BFA',
      '--role-bg': '#F8FAFC',
      '--role-sidebar-bg': '#FFFFFF',
      '--role-header-bg': '#FFFFFF',
      '--role-card-bg': '#FFFFFF',
      '--role-border': '#E2E8F0',
      '--role-surface': '#F5F3FF',
      '--role-surface-hover': '#EDE9FE',
      '--role-login-from': '#4C1D95',
      '--role-login-to': '#7C3AED',
      '--role-login-glow': '#8B5CF6',
    },
    dark: {
      '--role-primary': '#8B5CF6',
      '--role-secondary': '#A78BFA',
      '--role-tertiary': '#C4B5FD',
      '--role-bg': '#0B0F19',
      '--role-sidebar-bg': '#0F172A',
      '--role-header-bg': '#0F172A',
      '--role-card-bg': '#131B2E',
      '--role-border': '#1E293B',
      '--role-surface': 'rgba(139, 92, 246, 0.12)',
      '--role-surface-hover': 'rgba(139, 92, 246, 0.22)',
      '--role-login-from': '#2E1065',
      '--role-login-to': '#5B21B6',
      '--role-login-glow': '#8B5CF6',
    },
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [role, setRoleState] = useState<RoleType | null>(null);
  const pathname = usePathname();

  const applyDomVariables = (currentTheme: 'light' | 'dark', currentRole: RoleType | null) => {
    if (typeof document === 'undefined') return;
    const activeRole = currentRole || 'student';
    const vars = roleThemeVars[activeRole]?.[currentTheme] || roleThemeVars.student[currentTheme];
    
    Object.entries(vars).forEach(([prop, value]) => {
      document.documentElement.style.setProperty(prop, value);
    });
  };

  const setRole = (newRole: RoleType | null) => {
    setRoleState(newRole);
    if (typeof document !== 'undefined') {
      if (newRole) {
        document.documentElement.setAttribute('data-role', newRole);
      } else {
        document.documentElement.removeAttribute('data-role');
      }
      applyDomVariables(theme, newRole);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const isDark = storedTheme === 'dark';
    const effectiveTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';
    setTheme(effectiveTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    applyDomVariables(effectiveTheme, role);
  }, []);

  // Automatic pathname-based role synchronization
  useEffect(() => {
    let detectedRole: RoleType | null = null;
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
    } else {
      applyDomVariables(theme, role);
    }
  }, [pathname, theme]);

  const toggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    applyDomVariables(nextTheme, role);
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
