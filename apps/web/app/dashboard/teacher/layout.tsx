'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  CheckSquare, 
  UploadCloud, 
  FileText, 
  Clock, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';

const teacherNav = [
  { name: 'Dashboard', href: '/dashboard/teacher', icon: Users },
  { name: 'Mark Attendance', href: '/dashboard/teacher/attendance', icon: CheckSquare },
  { name: 'Upload Notes & Syllabus', href: '/dashboard/teacher/notes', icon: UploadCloud },
  { name: 'Students & Roster', href: '/dashboard/teacher/students', icon: FileText },
  { name: 'Class Timetable', href: '/dashboard/teacher/timetable', icon: Clock },
  { name: 'Settings', href: '/dashboard/teacher/settings', icon: Settings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Teacher Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              T
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">Faculty Portal</h2>
              <p className="text-[11px] text-slate-400 font-mono">{user?.name || 'Faculty Member'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {teacherNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' 
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