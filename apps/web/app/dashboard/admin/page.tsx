'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@campus-connect/ui';
import { useAuth } from '../../../components/AuthProvider';
import { useSocket } from '../../../components/SocketProvider';
import { api } from '../../../utils/api';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Megaphone, 
  Plus, 
  ShieldCheck, 
  Activity, 
  ClipboardCheck,
  Server,
  Loader2,
  Building2,
  Monitor
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments?: number;
  pendingTasks?: number;
  activeSessions?: number;
  notesCount: number;
  assignmentsCount: number;
  eventsCount: number;
  announcementsCount: number;
  attendancePercentage: number;
  pendingApprovals: number;
  systemHealth?: {
    status: string;
    database: string;
    uptime: number;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({
    services: {
      api: 'UP',
      database: 'UP',
      redis: 'UP',
      socketIo: 'UP',
      storage: 'UP',
    }
  });

  const loadDashboard = useCallback(async () => {
    try {
      // Execute all 4 API queries concurrently in parallel
      const [dashboardResult, logsResult, timetableResult, announcementsResult] = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getAuditLogs(),
        api.getAdminTimetable(),
        api.getAnnouncements(),
      ]);

      // 1. Process Dashboard Stats
      if (dashboardResult.status === 'fulfilled' && dashboardResult.value.success && dashboardResult.value.data) {
        setStats(dashboardResult.value.data);
      }

      // 2. Process Audit Logs
      if (logsResult.status === 'fulfilled' && logsResult.value.success && logsResult.value.data?.length > 0) {
        const mapped = logsResult.value.data.slice(0, 6).map((l: any) => {
          let timeStr = 'Just now';
          try {
            timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch (_) {}
          return {
            time: timeStr,
            user: l.userName || 'System',
            action: `${l.action}${l.details ? ' — ' + l.details : ''}`,
          };
        });
        setLogs(mapped);
      }

      // 3. Process Today's Timetable
      if (timetableResult.status === 'fulfilled' && timetableResult.value.success && timetableResult.value.data?.length > 0) {
        const todayNum = new Date().getDay(); // 0=Sun
        const dayOfWeekIndexMap: Record<number, number> = {
          0: 6, // Sunday -> 6
          1: 0, // Monday -> 0
          2: 1, // Tuesday -> 1
          3: 2, // Wednesday -> 2
          4: 3, // Thursday -> 3
          5: 4, // Friday -> 4
          6: 5, // Saturday -> 5
        };
        const dbDayInt = dayOfWeekIndexMap[todayNum];
        const todaySlots = timetableResult.value.data
          .filter((s: any) => s.dayOfWeek === dbDayInt)
          .slice(0, 4)
          .map((s: any) => ({
            time: `${s.startTime || '09:00'} - ${s.endTime || '10:00'}`,
            subject: s.subject?.name || 'Class',
            room: s.room || 'TBD',
            teacher: s.teacher?.user?.name || 'Faculty',
          }));
        if (todaySlots.length > 0) setClasses(todaySlots);
      }

      // 4. Process Announcements
      if (announcementsResult.status === 'fulfilled' && announcementsResult.value.success && announcementsResult.value.data?.length > 0) {
        const mapped = announcementsResult.value.data.slice(0, 3).map((a: any) => ({
          title: a.title,
          date: new Date(a.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          category: a.category || 'General',
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Socket subscriptions — auto-refresh on real-time events
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => loadDashboard();
    const handleSystemHealth = (data: any) => {
      console.log('Socket system:health:', data);
      setSystemHealth(data);
    };

    socket.on('TIMETABLE_UPDATED', handleRefresh);
    socket.on('attendanceUpdate', handleRefresh);
    socket.on('BROADCAST.SENT', handleRefresh);
    socket.on('ANNOUNCEMENT.CREATED', handleRefresh);
    socket.on('ANNOUNCEMENT.UPDATED', handleRefresh);
    socket.on('student:created', handleRefresh);
    socket.on('teacher:created', handleRefresh);
    socket.on('attendance:updated', handleRefresh);
    socket.on('notes:uploaded', handleRefresh);
    socket.on('result:published', handleRefresh);
    socket.on('timetable:published', handleRefresh);
    socket.on('announcement:new', handleRefresh);
    socket.on('audit:log', handleRefresh);
    socket.on('system:health', handleSystemHealth);

    return () => {
      socket.off('TIMETABLE_UPDATED', handleRefresh);
      socket.off('attendanceUpdate', handleRefresh);
      socket.off('BROADCAST.SENT', handleRefresh);
      socket.off('ANNOUNCEMENT.CREATED', handleRefresh);
      socket.off('ANNOUNCEMENT.UPDATED', handleRefresh);
      socket.off('student:created', handleRefresh);
      socket.off('teacher:created', handleRefresh);
      socket.off('attendance:updated', handleRefresh);
      socket.off('notes:uploaded', handleRefresh);
      socket.off('result:published', handleRefresh);
      socket.off('timetable:published', handleRefresh);
      socket.off('announcement:new', handleRefresh);
      socket.off('audit:log', handleRefresh);
      socket.off('system:health', handleSystemHealth);
    };
  }, [socket, loadDashboard]);

  const statCards = [
    { 
      label: 'Total Students', 
      count: statsLoading ? '—' : (stats?.totalStudents ?? 0).toLocaleString(), 
      icon: <GraduationCap className="h-5 w-5 text-blue-500" />, 
      href: '/dashboard/admin/students' 
    },
    { 
      label: 'Total Teachers', 
      count: statsLoading ? '—' : (stats?.totalTeachers ?? 0).toLocaleString(), 
      icon: <Users className="h-5 w-5 text-indigo-500" />, 
      href: '/dashboard/admin/teachers' 
    },
    { 
      label: 'Total Departments', 
      count: statsLoading ? '—' : (stats?.totalDepartments ?? 0).toLocaleString(), 
      icon: <Building2 className="h-5 w-5 text-emerald-500" />, 
      href: '/dashboard/admin/departments' 
    },
    { 
      label: 'Pending Tasks', 
      count: statsLoading ? '—' : (stats?.pendingTasks ?? 0).toLocaleString(), 
      icon: <ClipboardCheck className="h-5 w-5 text-amber-500" />, 
      href: '/dashboard/admin/tasks' 
    },
    { 
      label: 'Active Sessions', 
      count: statsLoading ? '—' : (stats?.activeSessions ?? 0).toLocaleString(), 
      icon: <Monitor className="h-5 w-5 text-purple-500" />, 
      href: '/dashboard/admin/settings' 
    },
    { 
      label: 'System Status', 
      count: statsLoading ? '—' : (stats?.systemHealth?.status || 'HEALTHY'), 
      icon: <Activity className="h-5 w-5 text-emerald-500" />, 
      href: '/dashboard/admin/settings' 
    },
  ];

  return (
    <DashboardLayout title="Control Center" icon={<ShieldCheck className="h-6 w-6" />}>
      <div className="space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors duration-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back, {user?.name || 'Administrator'}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Live overview of college status, attendance, and administrative operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Live Data</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {statCards.map((stat, idx) => (
            <Link key={idx} href={stat.href}>
              <Card className="hover:shadow-sm hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {stat.label}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                      {stat.icon}
                    </div>
                  </div>
                  <span className="text-lg font-black text-slate-950 dark:text-white block truncate">
                    {statsLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : stat.count}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Second Row Widgets — from real API */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { 
              label: 'Today Attendance', 
              value: statsLoading ? '—' : `${Math.round(stats?.attendancePercentage ?? 0)}%`, 
              icon: <ClipboardCheck className="h-4 w-4 text-amber-500" /> 
            },
            { 
              label: 'Events Active', 
              value: statsLoading ? '—' : (stats?.eventsCount ?? 0).toString(), 
              icon: <Calendar className="h-4 w-4 text-indigo-500" /> 
            },
            { 
              label: 'Announcements', 
              value: statsLoading ? '—' : (stats?.announcementsCount ?? 0).toString(), 
              icon: <Megaphone className="h-4 w-4 text-purple-500" /> 
            },
          ].map((item, idx) => (
            <Card key={idx} className="border-slate-100/80 dark:border-slate-800/60 bg-slate-50/30 hover:border-slate-200 transition-all duration-250">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                  {item.icon}
                </div>
                <span className="text-base font-extrabold text-slate-800 dark:text-white block">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : item.value}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Panel */}
        <Card className="border-slate-100/90 dark:border-slate-800/60 shadow-sm">
          <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-900/60">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Quick Operations Control</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              
              <Link href="/dashboard/admin/students?action=add">
                <Button className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-role-primary hover:bg-role-secondary text-white border-transparent font-medium text-sm transition-all duration-150 shadow-md shadow-role-primary/10">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Add Student</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/admin/teachers?action=add">
                <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                  <Plus className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Add Teacher</span>
                </Button>
              </Link>

              <Link href="/dashboard/admin/events?action=create">
                <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Create Event</span>
                </Button>
              </Link>

              <Link href="/dashboard/admin/learning-center?action=upload">
                <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                  <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Upload Notes</span>
                </Button>
              </Link>

              <Link href="/dashboard/admin/announcements?action=publish">
                <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                  <Megaphone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Publish Ann.</span>
                </Button>
              </Link>

              <Link href="/dashboard/admin/tasks">
                <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 hover:bg-amber-50 font-medium text-sm transition-all duration-150">
                  <ClipboardCheck className="h-4 w-4 shrink-0" />
                  <span>Task Center</span>
                </Button>
              </Link>

            </div>
          </CardContent>
        </Card>

        {/* Dynamic System Status & Quick Management Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Real-time System Nodes Status */}
          <Card>
            <CardHeader className="border-b border-slate-50 dark:border-slate-900/60 px-6 py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="h-4 w-4 text-slate-400 shrink-0" />
                <span>System Nodes Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">PostgreSQL DB Cluster</span>
                <span className={`font-semibold px-2.5 py-1 rounded-md text-[11px] ${
                  systemHealth?.services?.database === 'UP'
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                    : 'text-rose-600 bg-rose-550/10 border border-rose-500/20'
                }`}>
                  {systemHealth?.services?.database === 'UP' ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Redis Session Cache</span>
                <span className={`font-semibold px-2.5 py-1 rounded-md text-[11px] ${
                  systemHealth?.services?.redis === 'UP'
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                    : 'text-rose-600 bg-rose-550/10 border border-rose-500/20'
                }`}>
                  {systemHealth?.services?.redis === 'UP' ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">NestJS Core API Gateway</span>
                <span className={`font-semibold px-2.5 py-1 rounded-md text-[11px] ${
                  systemHealth?.services?.api === 'UP'
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                    : 'text-rose-600 bg-rose-550/10 border border-rose-500/20'
                }`}>
                  {systemHealth?.services?.api === 'UP' ? 'Operational' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Socket.IO Real-time Engine</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-2.5 py-1 rounded-md text-[11px]">Operational</span>
              </div>
            </CardContent>
          </Card>

          {/* Core Navigation Shortcuts */}
          <Card>
            <CardHeader className="border-b border-slate-50 dark:border-slate-900/60 px-6 py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Administrative Workspaces</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-3">
              <Link href="/dashboard/admin/students" className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 transition-colors">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Student Directory</span>
                <span className="text-[10px] text-slate-400">Bulk import & roster</span>
              </Link>
              <Link href="/dashboard/admin/teachers" className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 transition-colors">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Teacher Directory</span>
                <span className="text-[10px] text-slate-400">Faculty management</span>
              </Link>
              <Link href="/dashboard/admin/timetable" className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 transition-colors">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">AI Timetable Hub</span>
                <span className="text-[10px] text-slate-400">Conflict resolver</span>
              </Link>
              <Link href="/dashboard/admin/reports" className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 transition-colors">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Reports & Analytics</span>
                <span className="text-[10px] text-slate-400">Background generation</span>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Real-time Activity & Timetable Log Grid */}
        <Card className="mt-6 border-slate-100/90 dark:border-slate-800/60 shadow-sm">
          <CardHeader className="px-6 py-4 border-b border-slate-50 dark:border-slate-900/60 flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Real-Time Campus Activity Audit ({logs.length + classes.length + announcements.length} items)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {logs.length === 0 && classes.length === 0 && announcements.length === 0 ? (
                <p className="text-xs text-slate-400">All campus systems running smoothly. No recent security or activity flags.</p>
              ) : (
                logs.slice(0, 5).map((log, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-900/40 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{log.user}:</span>
                      <span className="text-slate-500 dark:text-slate-400">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
