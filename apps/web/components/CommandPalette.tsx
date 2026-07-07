import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Search, Sparkles, Megaphone, Users, GraduationCap, Settings, ClipboardList, FolderInput, LogOut, Shield } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle Command Palette with Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  // Define commands based on role
  const allCommands = [
    {
      name: 'Go to Student Dashboard',
      description: 'Access academic performance, schedule, and attendance',
      icon: <GraduationCap className="h-5 w-5 text-blue-500" />,
      action: () => router.push('/dashboard/student'),
      roles: ['STUDENT'],
    },
    {
      name: 'View Academic Performance',
      description: 'Check CGPA, SGPA, grades, and marks statistics',
      icon: <ClipboardList className="h-5 w-5 text-indigo-500" />,
      action: () => router.push('/dashboard/student/performance'),
      roles: ['STUDENT'],
    },
    {
      name: 'Check Student Attendance',
      description: 'Review overall attendance percentage and breakdown',
      icon: <ClipboardList className="h-5 w-5 text-emerald-500" />,
      action: () => router.push('/dashboard/student/attendance'),
      roles: ['STUDENT'],
    },
    // Admin Commands
    {
      name: 'Go to Admin Dashboard',
      description: 'Access management console room and statistics',
      icon: <Shield className="h-5 w-5 text-amber-600" />,
      action: () => router.push('/dashboard/admin'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Open Import Center',
      description: 'Bulk register students, teachers, departments, and courses',
      icon: <FolderInput className="h-5 w-5 text-blue-600" />,
      action: () => router.push('/dashboard/admin/import'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Manage Students',
      description: 'Search, view details, update division, or disable student profiles',
      icon: <GraduationCap className="h-5 w-5 text-indigo-600" />,
      action: () => router.push('/dashboard/admin/students'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Manage Teachers',
      description: 'Add teacher profiles, assign subjects, or view departments',
      icon: <Users className="h-5 w-5 text-purple-600" />,
      action: () => router.push('/dashboard/admin/teachers'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Manage Events',
      description: 'Schedule campus hackathons, sports, and cultural festivals',
      icon: <Sparkles className="h-5 w-5 text-pink-600" />,
      action: () => router.push('/dashboard/admin/events'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Manage Announcements',
      description: 'Broadcast alerts and news items to college portals',
      icon: <Megaphone className="h-5 w-5 text-amber-500" />,
      action: () => router.push('/dashboard/admin/announcements'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'View Audit Logs',
      description: 'Monitor administrative operations, updates, and logins',
      icon: <ClipboardList className="h-5 w-5 text-slate-500" />,
      action: () => router.push('/dashboard/admin/audit-logs'),
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    // Common Commands
    {
      name: 'Open System Settings',
      description: 'Configure security settings, profile, and theme options',
      icon: <Settings className="h-5 w-5 text-slate-655" />,
      action: () => router.push(user.role === 'STUDENT' ? '/dashboard/student/settings' : '/dashboard/admin/settings'),
      roles: ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Sign Out / Log Out',
      description: 'Safely terminate active browser session and cache',
      icon: <LogOut className="h-5 w-5 text-red-500" />,
      action: () => {
        logout();
        setIsOpen(false);
        router.push('/');
      },
      roles: ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    },
  ];

  // Filter commands by user role and search input
  const filteredCommands = allCommands.filter((cmd) => {
    const matchesRole = cmd.roles.includes(user.role);
    const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) || 
                          cmd.description.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Handle arrow key navigation and enter submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      scrollIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      scrollIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Keep selected option visible in scroll list
  const scrollIntoView = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const elements = list.querySelectorAll('[role="option"]');
    const target = elements[index % filteredCommands.length] as HTMLElement;
    if (target) {
      if (target.offsetTop < list.scrollTop) {
        list.scrollTop = target.offsetTop;
      } else if (target.offsetTop + target.clientHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = target.offsetTop + target.clientHeight - list.clientHeight;
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-md z-[9999] flex items-start justify-center pt-24 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-slate-105 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-base focus:outline-none focus:ring-0"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg uppercase tracking-wider select-none shrink-0">
            Esc
          </span>
        </div>

        {/* Command Options List */}
        <div 
          ref={listRef}
          className="max-h-[340px] overflow-y-auto p-2.5 space-y-1"
          role="listbox"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.name}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-start gap-4 px-4 py-3 rounded-2xl transition-all duration-150 border ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 text-slate-900 dark:text-white border-blue-100/50 dark:border-blue-900/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shrink-0">
                    {cmd.icon}
                  </div>
                  <div className="flex-1 flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cmd.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{cmd.description}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-105/50 dark:border-blue-900/50 self-center">
                      Enter
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">No matching commands found.</span>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-105 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div>
            <span>Press <span className="text-blue-500 font-bold font-sans lowercase">ctrl+k</span> to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
};
