'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { getCollegeName, getCollegeLogo } from '@campus-connect/utils';
import { LogOut, User as UserIcon, Settings, GraduationCap, BookOpen, Menu, X, Bell, Sun, Moon, LayoutDashboard, LineChart, Calendar, Clock, Sparkles, Megaphone, Users, Building2, Activity, FolderInput, ClipboardCheck } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, icon }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return null;
  }

  // Define sidebar items based on UserRole
  const sidebarItems = [];
  if (user.role === 'STUDENT') {
    sidebarItems.push(
      { name: 'Dashboard', path: '/dashboard/student', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Performance', path: '/dashboard/student/performance', icon: <LineChart className="h-5 w-5" /> },
      { name: 'Attendance', path: '/dashboard/student/attendance', icon: <Calendar className="h-5 w-5" /> },
      { name: 'Notes', path: '/dashboard/student/notes', icon: <BookOpen className="h-5 w-5" /> },
      { name: 'Timetable', path: '/dashboard/student/timetable', icon: <Clock className="h-5 w-5" /> },
      { name: 'Events', path: '/dashboard/student/events', icon: <Sparkles className="h-5 w-5" /> },
      { name: 'Announcements', path: '/dashboard/student/announcements', icon: <Megaphone className="h-5 w-5" /> },
      { name: 'Profile', path: '/dashboard/student/profile', icon: <UserIcon className="h-5 w-5" /> },
      { name: 'Settings', path: '/dashboard/student/settings', icon: <Settings className="h-5 w-5" /> }
    );
  } else if (user.role === 'TEACHER') {
    sidebarItems.push(
      { name: 'Dashboard', path: '/dashboard/teacher', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Attendance Work Center', path: '/dashboard/teacher/attendance', icon: <ClipboardCheck className="h-5 w-5" /> },
      { name: 'Notes & Learning Hub', path: '/dashboard/student/notes', icon: <BookOpen className="h-5 w-5" /> }
    );
  } else if (user.role === 'ADMIN') {
    sidebarItems.push(
      { name: 'Dashboard', path: '/dashboard/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Student Management', path: '/dashboard/admin/students', icon: <GraduationCap className="h-5 w-5" /> },
      { name: 'Teacher Management', path: '/dashboard/admin/teachers', icon: <Users className="h-5 w-5" /> },
      { name: 'Academic Management', path: '/dashboard/admin/academic', icon: <Building2 className="h-5 w-5" /> },
      { name: 'Timetable Management', path: '/dashboard/admin/timetable', icon: <Clock className="h-5 w-5" /> },
      { name: 'Attendance Command Center', path: '/dashboard/admin/attendance', icon: <ClipboardCheck className="h-5 w-5" /> },
      { name: 'Learning Center', path: '/dashboard/admin/learning-center', icon: <BookOpen className="h-5 w-5" /> },
      { name: 'Event Management', path: '/dashboard/admin/events', icon: <Sparkles className="h-5 w-5" /> },
      { name: 'Announcement Center', path: '/dashboard/admin/announcements', icon: <Megaphone className="h-5 w-5" /> },
      { name: 'Reports & Analytics', path: '/dashboard/admin/reports', icon: <LineChart className="h-5 w-5" /> },
      { name: 'Notification Center', path: '/dashboard/admin/notifications', icon: <Bell className="h-5 w-5" /> },
      { name: 'Import / Export Center', path: '/dashboard/admin/import', icon: <FolderInput className="h-5 w-5" /> },
      { name: 'Audit Logs', path: '/dashboard/admin/audit-logs', icon: <Activity className="h-5 w-5" /> },
      { name: 'College Settings', path: '/dashboard/admin/settings', icon: <Settings className="h-5 w-5" /> }
    );
  }

  const getCollegeBgTag = (id: string) => {
    switch (id) {
      case 'college-a': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900';
      case 'college-b': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900';
      case 'college-c': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-850 dark:text-slate-100 transition-colors duration-300">
      <CommandPalette />
      {/* Top Header */}
      <header className="h-16 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900 sticky top-0 z-30 px-6 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center gap-2">
            {user.role === 'TEACHER' ? (
              <div className="flex items-center -space-x-2.5 overflow-hidden">
                {(['college-a', 'college-b', 'college-c'] as any[]).map((cid) => (
                  <div key={cid} className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-slate-200/80 dark:border-slate-800 p-0.5 shadow-sm ring-2 ring-white dark:ring-slate-900 shrink-0">
                    <img 
                      src={getCollegeLogo(cid)} 
                      alt="College Logo" 
                      className="w-full h-full object-contain rounded-md"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-slate-200/60 dark:border-slate-800 p-0.5 shadow-sm">
                <img 
                  src={getCollegeLogo(user.collegeId)} 
                  alt="College Logo" 
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
            )}
            <span className="font-display font-bold text-lg text-slate-900 dark:text-white hidden sm:inline">
              CampusConnect
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* College Tag */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            user.role === 'TEACHER' 
              ? 'bg-slate-100 text-slate-700 border-slate-250 dark:bg-slate-900 dark:text-slate-355 dark:border-slate-800' 
              : getCollegeBgTag(user.collegeId)
          }`}>
            {user.role === 'TEACHER' ? 'Balasaheb Mhatre Group Faculty' : getCollegeName(user.collegeId)}
          </span>
        </div>

        {/* User profile details */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{user.role.replace('_', ' ')}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex relative">
        {/* Sidebar Left Navigation (Desktop) */}
        <aside className="w-64 border-r border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900 hidden md:flex flex-col p-4 shrink-0 transition-colors duration-300">
          <nav className="space-y-1.5 flex-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 dark:border-slate-900 pt-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-900 flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Workspace settings</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-20 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-900 p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-1.5 flex-1">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-sm font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Inner Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-colors duration-300">
          <div className="mb-6 flex flex-col gap-1.5">
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              {icon && <span className="text-blue-600 dark:text-blue-400 shrink-0">{icon}</span>}
              <span>{title}</span>
            </h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
