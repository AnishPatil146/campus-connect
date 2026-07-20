'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Redirect to role-specific dashboard
        if (user.role === 'STUDENT') {
          router.replace('/dashboard/student');
        } else if (user.role === 'TEACHER') {
          router.replace('/dashboard/teacher');
        } else if (user.role === 'ADMIN') {
          router.replace('/dashboard/admin');
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 transition-all duration-300">
      <div className="relative flex flex-col items-center justify-center p-8 text-center select-none">
        {/* Outer spinning gradient ring */}
        <div className="absolute h-24 w-24 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 dark:border-t-emerald-450 animate-spin" />
        
        {/* Centered upright Campus Connect Logo */}
        <div className="h-16 w-16 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center font-display font-black text-white dark:text-slate-950 text-3xl shadow-xl shadow-slate-900/10 dark:shadow-none relative z-10">
          C
        </div>
        
        <p className="mt-6 text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 animate-pulse relative z-10">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}
