'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react';

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (data: any) => {
        setNotifications((prev) => [data, ...prev]);
      };
      socket.on('notification:new', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout title="Student Notification Center" icon={<Bell className="h-6 w-6 text-role-primary" />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-role-surface border border-role-border p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Notifications & Alerts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time notices for attendance updates, notes published, and exam results.
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-role-primary text-white hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            Mark All as Read
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-role-surface border border-role-border rounded-2xl">
            No notifications available.
          </div>
        ) : (
          <Card className="border-role-border bg-role-card-bg">
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
              {notifications.map((notif, idx) => (
                <div key={notif.id || idx} className={`p-4 transition-colors flex items-start justify-between gap-4 ${notif.read ? 'bg-transparent opacity-80' : 'bg-role-primary/5 font-medium'}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title || 'Academic Update'}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{notif.content || notif.body}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(notif.createdAt || Date.now()).toLocaleTimeString()}
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
