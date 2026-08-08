'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  UserCheck, 
  BarChart3, 
  Megaphone, 
  ShieldAlert, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';

const adminNav = [
  { name: 'Admin Console', href: '/dashboard/admin', icon: Building2 },
  { name: 'Student Roster', href: '/dashboard/admin/students', icon: Users },
  { name: 'Faculty Roster', href: '/dashboard/admin/teachers', icon: UserCheck },
  { name: 'Reports & Exports', href: '/dashboard/admin/reports', icon: BarChart3 },
  { name: 'Announcements', href: '/dashboard/admin/announcements', icon: Megaphone },
  { name: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ShieldAlert },
  { name: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-md">
              A
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">Admin Console</h2>
              <p className="text-[11px] text-slate-400 font-mono">{user?.name || 'Administrator'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold' 
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