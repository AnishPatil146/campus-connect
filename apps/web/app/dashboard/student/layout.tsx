'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  GraduationCap, 
  CalendarCheck, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';

const studentNav = [
  { name: 'Overview', href: '/dashboard/student', icon: GraduationCap },
  { name: 'Attendance', href: '/dashboard/student/attendance', icon: CalendarCheck },
  { name: 'Notes & Syllabus', href: '/dashboard/student/notes', icon: BookOpen },
  { name: 'Events', href: '/dashboard/student/events', icon: Calendar },
  { name: 'Performance', href: '/dashboard/student/performance', icon: TrendingUp },
  { name: 'Profile', href: '/dashboard/student/profile', icon: User },
  { name: 'Settings', href: '/dashboard/student/settings', icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Student Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              S
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">Student Portal</h2>
              <p className="text-[11px] text-slate-400 font-mono">{user?.name || 'Student Account'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {studentNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}