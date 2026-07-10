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
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}
