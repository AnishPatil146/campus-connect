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
  Clock, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  ClipboardCheck,
  Server,
  Loader2,
  Building2,
  Monitor
} from 'lucide-react';

interface AuditLog {
  time: string;
  user: string;
  action: string;
}

interface TimetableItem {
  time: string;
  subject: string;
  room: string;
  teacher: string;
}

interface Announcement {
  title: string;
  date: string;
  category: string;
}

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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [classes, setClasses] = useState<TimetableItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
    // Load dashboard stats from real API
    try {
      const res = await api.getAdminDashboard();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setStatsLoading(false);
    }

    // Load audit logs from real API
    try {
      const logsRes = await api.getAuditLogs();
      if (logsRes.success && logsRes.data.length > 0) {
        const mapped = logsRes.data.slice(0, 6).map((l: any) => {
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
    } catch (err) {
      console.error('Failed to load logs:', err);
    }

    // Load today's timetable from real API
    try {
      const ttRes = await api.getAdminTimetable();
      if (ttRes.success && ttRes.data.length > 0) {
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
        const todaySlots = ttRes.data
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
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }

    // Load announcements from real API
    try {
      const annRes = await api.getAnnouncements();
      if (annRes.success && annRes.data.length > 0) {
        const mapped = annRes.data.slice(0, 3).map((a: any) => ({
          title: a.title,
          date: new Date(a.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          category: a.category || 'General',
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
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

        {/* Dynamic Lists Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Today's Timetable (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-900/60 px-6 py-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Today's Academic Timetable</span>
                  </CardTitle>
                </div>
                <Link href="/dashboard/admin/timetable">
                  <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    Full Schedule
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-slate-50 dark:divide-slate-900/40">
                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No classes scheduled for today.</p>
                ) : classes.map((cls, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-role-surface/60 dark:bg-role-surface/20 text-role-primary flex items-center justify-center shrink-0 mt-0.5 border border-role-border/50">
                        <BookOpen className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{cls.subject}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cls.teacher} • <span className="font-semibold text-slate-500">{cls.room}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 px-2.5 py-1 rounded-lg">
                        {cls.time}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-900/60 px-6 py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Recent Announcements</span>
                </CardTitle>
                <Link href="/dashboard/admin/announcements">
                  <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">No announcements yet.</p>
                ) : announcements.map((ann, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-50 dark:border-slate-900/50 bg-slate-50/20 dark:bg-slate-900/10 hover:bg-slate-50/40 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {ann.category}
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm pt-1">{ann.title}</h4>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{ann.date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Logs & System Status (Span 1) */}
          <div className="space-y-6">
            
            {/* Audit Logs */}
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-900/60 px-6 py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Recent Audit Logs</span>
                </CardTitle>
                <Link href="/dashboard/admin/audit-logs">
                  <ChevronRight className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer" />
                </Link>
              </CardHeader>
              <CardContent className="p-6 flex-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
                ) : (
                  <div className="relative border-l border-slate-100 dark:border-slate-800/80 ml-2.5 pl-5 space-y-6">
                    {logs.map((log, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute top-1.5 -left-7.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-950" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 block">{log.time}</span>
                          <p className="text-xs text-slate-650 dark:text-slate-350">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{log.user}:</span> {log.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card>
              <CardHeader className="border-b border-slate-50 dark:border-slate-900/60 px-6 py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Server className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>System Nodes Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">PostgreSQL DB Cluster</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${
                    systemHealth?.services?.database === 'UP'
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                      : 'text-rose-600 bg-rose-550/10 border border-rose-500/20'
                  }`}>
                    {systemHealth?.services?.database === 'UP' ? 'Connected' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Redis Session Cache</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${
                    systemHealth?.services?.redis === 'UP'
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                      : 'text-rose-600 bg-rose-550/10 border border-rose-500/20'
                  }`}>
                    {systemHealth?.services?.redis === 'UP' ? 'Connected' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">NestJS Core API Gateway</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${
                    systemHealth?.services?.api === 'UP'
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                      : 'text-rose-600 bg-rose-550/10 border border-rose-500/20'
                  }`}>
                    {systemHealth?.services?.api === 'UP' ? 'Operational' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Socket.IO Real-time Engine</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded">Operational</span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
