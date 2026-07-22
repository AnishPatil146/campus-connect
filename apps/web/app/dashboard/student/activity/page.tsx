'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';

export default function StudentActivityPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 25 });
      if (res.success && res.data) {
        setActivities(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch student activity logs:', e);
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
      const handleAudit = (data: any) => {
        setActivities((prev) => [data, ...prev]);
      };
      socket.on('audit:log', handleAudit);
      return () => {
        socket.off('audit:log', handleAudit);
      };
    }
  }, [socket]);

  return (
    <DashboardLayout title="Student Activity Stream" icon={<Activity className="h-6 w-6 text-role-primary" />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-role-surface border border-role-border p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Academic Activity & Stream
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live updates of classroom attendance, homework assignments, and grade entries.
            </p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 self-start sm:self-auto">
            Live Stream
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
              <CardTitle className="text-sm font-bold">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
              {activities.map((act, idx) => (
                <div key={act.id || idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-role-primary/10 text-role-primary flex items-center justify-center font-bold text-xs shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{act.action || act.description || 'Academic Event'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Module: {act.module || 'Student Portal'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(act.timestamp || act.createdAt || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
