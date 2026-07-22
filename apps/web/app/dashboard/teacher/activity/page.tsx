'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';
import { Activity, Clock, ShieldAlert, CheckCircle2, User } from 'lucide-react';

export default function TeacherActivityPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 30 });
      if (res.success && res.data) {
        setActivities(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch activity logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleAuditLog = (data: any) => {
        setActivities((prev) => [data, ...prev]);
      };
      socket.on('audit:log', handleAuditLog);
      return () => {
        socket.off('audit:log', handleAuditLog);
      };
    }
  }, [socket]);

  return (
    <DashboardLayout title="Faculty Activity & Audit Trail" icon={<Activity className="h-6 w-6 text-role-primary" />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-role-surface border border-role-border p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Real-Time Faculty Activity Feed
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live audit stream of all academic submissions, attendance logging, and result publications.
            </p>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 self-start sm:self-auto">
            Socket.IO Active
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading activity feed...</div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-role-surface border border-role-border rounded-2xl">
            No activity logs found.
          </div>
        ) : (
          <Card className="border-role-border bg-role-card-bg">
            <CardHeader className="pb-3 border-b border-role-border/50">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Recent System Activities</span>
                <span className="text-xs text-slate-400 font-normal">{activities.length} Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
              {activities.map((act, idx) => (
                <div key={act.id || idx} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-role-primary/10 text-role-primary flex items-center justify-center font-bold text-xs shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{act.action || act.description || 'Academic Operation'}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>User: {act.userName || act.user?.name || user?.name}</span>
                        <span>•</span>
                        <span>Module: {act.module || 'Academic'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(act.timestamp || act.createdAt || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
