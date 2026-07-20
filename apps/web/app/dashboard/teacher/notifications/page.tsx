'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';
import { Bell, CheckCircle2, AlertCircle, Trash2, Eye } from 'lucide-react';

export default function TeacherNotificationsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error(e);
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
      const handleNotification = () => fetchNotifications();
      socket.on('notification:new', handleNotification);
      return () => {
        socket.off('notification:new', handleNotification);
      };
    }
  }, [socket]);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await api.markNotificationAsRead(id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        setSuccessMsg('All notifications marked as read.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout title="In-App Notifications" icon={<Bell className="h-6 w-6 text-emerald-500" />}>
      <div className="max-w-4xl mx-auto space-y-6">
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alert Registry</h3>
            <p className="text-xs text-slate-500 mt-1">Review alerts, updates, and system broadcasts sent to you.</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md active:scale-[0.98] transition-all shrink-0"
            >
              Mark All Read
            </button>
          )}
        </div>

        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="h-10 w-10 text-slate-350 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 font-bold">You are all caught up!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No new notifications found in the database.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                      notif.read
                        ? 'opacity-60 bg-white dark:bg-slate-950'
                        : 'bg-slate-50/30 dark:bg-slate-900/10 hover:bg-slate-50/60 dark:hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">{notif.content}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
