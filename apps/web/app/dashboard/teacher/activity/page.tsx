'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherActivityPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/teacher');
  }, [router]);
  return null;
}
