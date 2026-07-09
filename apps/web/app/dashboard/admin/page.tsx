'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@campus-connect/ui';
import { useAuth } from '../../../components/AuthProvider';
import { api } from '../../../utils/api';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Calendar, 
  Megaphone, 
  Plus, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  ClipboardCheck,
  Server
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

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([
    { time: '10:15 AM', user: 'Admin', action: 'Added Student (Alex Rivera)' },
    { time: '11:20 AM', user: 'Admin', action: 'Uploaded OS Lecture Notes Unit 2' },
    { time: '01:45 PM', user: 'Admin', action: 'Created Campus Tech Fest Event' },
  ]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const resp = await api.getAuditLogs();
        if (resp.success && resp.data.length > 0) {
          const mapped = resp.data.slice(0, 5).map((l: any) => {
            let timeStr = 'Just now';
            try {
              // Parse date if it's full timestamp
              timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (timeStr === 'Invalid Date') {
                timeStr = l.timestamp; // fallback to string
              }
            } catch (_) {}
            return {
              time: timeStr,
              user: l.userName,
              action: `${l.action} - ${l.details || ''}`
            };
          });
          setLogs(mapped);
        }
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    }
    loadLogs();
  }, []);

  const [classes] = useState<TimetableItem[]>([
    { time: '09:00 AM - 10:00 AM', subject: 'Database Management Systems (DBMS)', room: 'Room 301', teacher: 'Prof. Amit Patil' },
    { time: '10:15 AM - 11:15 AM', subject: 'Operating Systems', room: 'Room 302', teacher: 'Dr. Sarah Jenkins' },
    { time: '11:30 AM - 12:30 PM', subject: 'Python Programming Lab', room: 'Computer Lab 3', teacher: 'Prof. Amit Patil' },
  ]);

  const [announcements] = useState<Announcement[]>([
    { title: 'Semester Results Published for Batch 2026', date: 'Today', category: 'Academic' },
    { title: 'Mid Semester Exam Time Table Updated', date: 'Yesterday', category: 'Exams' },
    { title: 'Monsoon Holiday Announcement: Saturday Closed', date: '02 Jul 2026', category: 'Holidays' },
  ]);

  // Statistics Metrics
  const stats = [
    { label: 'Students Enrolled', count: '1,245', icon: <GraduationCap className="h-5 w-5 text-blue-500" />, href: '/dashboard/admin/students' },
    { label: 'Faculty Members', count: '82', icon: <Users className="h-5 w-5 text-indigo-500" />, href: '#' },
    { label: 'Departments', count: '8', icon: <Building2 className="h-5 w-5 text-emerald-500" />, href: '#' },
    { label: 'Pending Tasks', count: '3', icon: <ClipboardCheck className="h-5 w-5 text-amber-500" />, href: '/dashboard/admin/tasks' },
  ];

  return (
    <DashboardLayout title="Control Center" icon={<ShieldCheck className="h-6 w-6" />}>
      <div className="space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors duration-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back, {user?.name || 'Administrator'}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Here is your overview of college status, upcoming lectures, and administrative operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">All Systems Operational</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, idx) => (
            <Link key={idx} href={stat.href}>
              <Card className="hover:shadow-sm hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-all duration-200 cursor-pointer">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <span className="text-3xl font-extrabold text-slate-950 dark:text-white block">
                      {stat.count}
                    </span>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                    {stat.icon}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Second Row Widgets (Section 5.4) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'New Admissions', value: '24', icon: <Plus className="h-4 w-4 text-blue-500" /> },
            { label: 'Teachers on Leave', value: '2', icon: <Users className="h-4 w-4 text-rose-500" /> },
            { label: 'Pending Attendance', value: '4', icon: <Clock className="h-4 w-4 text-amber-500" /> },
            { label: 'Upcoming Events', value: '1', icon: <Calendar className="h-4 w-4 text-indigo-500" /> },
            { label: 'Pending Reports', value: '3', icon: <ClipboardCheck className="h-4 w-4 text-purple-500" /> },
            { label: 'System Health', value: '99.9%', icon: <Server className="h-4 w-4 text-emerald-500" /> },
          ].map((item, idx) => (
            <Card key={idx} className="border-slate-100/80 dark:border-slate-800/60 bg-slate-50/30 hover:border-slate-200 transition-all duration-250">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                  {item.icon}
                </div>
                <span className="text-base font-extrabold text-slate-800 dark:text-white block">{item.value}</span>
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
                <Button className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 border border-transparent font-medium text-sm transition-all duration-150">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Add Student</span>
                </Button>
              </Link>
              
              <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                <Plus className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Add Teacher</span>
              </Button>

              <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Create Event</span>
              </Button>

              <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Upload Notes</span>
              </Button>

              <Button variant="secondary" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-all duration-150">
                <Megaphone className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Publish Ann.</span>
              </Button>

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
                <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  Full Schedule
                </Button>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-slate-50 dark:divide-slate-900/40">
                {classes.map((cls, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100/50 dark:border-blue-900/40">
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
                <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {announcements.map((ann, idx) => (
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
                  <span className="font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded">Offline (Dev Mode)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Firebase Session Manager</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded">Connected</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">NestJS Core API Gateway</span>
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
