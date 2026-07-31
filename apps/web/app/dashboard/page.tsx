'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

import { Settings } from 'lucide-react';

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
        <Settings className="h-14 w-14 text-emerald-500 animate-spin" />
        <p className="mt-4 text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 relative z-10">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}
