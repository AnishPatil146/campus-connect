'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Bell, Plus, Eye, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [recipientType, setRecipientType] = useState('ALL_STUDENTS');
  const [scheduledTime, setScheduledTime] = useState('');

  // Delivery tracking modal
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchNotificationLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotificationLogs();
    }
  }, [user]);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) return;

    try {
      const payload = {
        title,
        content: bodyText,
        type: 'ANNOUNCEMENT',
        recipientType,
        scheduledAt: scheduledTime ? new Date(scheduledTime).toISOString() : undefined,
      };

      const res = await api.sendNotification(payload);
      if (res.success) {
        setSuccessMsg(`Notification alert "${title}" dispatched! Recipient delivery tracking active.`);
        setTitle('');
        setBodyText('');
        setScheduledTime('');
        setShowSendModal(false);
        fetchNotificationLogs();
      } else {
        setErrorMsg(res.message || 'Failed to dispatch alert.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error dispatching notification.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  return (
    <DashboardLayout title="Notification Center & Alert Broadcasts" icon={<Bell className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top actions panel */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Push & In-App Notification Center</h4>
            <p className="text-xs text-slate-400 mt-0.5">Broadcast targeted alerts with scheduled execution & delivery tracking.</p>
          </div>
          
          <Button
            onClick={() => setShowSendModal(true)}
            className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Send Alert</span>
          </Button>
        </Card>

        {/* Sent logs */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading alert registry...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No alerts found. Click "Send Alert" to broadcast a notification.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification Details</TableHead>
                  <TableHead>Target Recipient</TableHead>
                  <TableHead>Scheduled / Sent Time</TableHead>
                  <TableHead>Delivery / Read Rate</TableHead>
                  <TableHead className="text-right font-semibold">Track Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const recipients = log.recipients || [];
                  const readCount = recipients.filter((r: any) => r.isRead || r.readAt).length;
                  const totalRecipients = recipients.length || 1;
                  const readPct = Math.round((readCount / totalRecipients) * 100);

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="max-w-md">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{log.title || 'Broadcast Alert'}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{log.content || log.body}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                          {log.recipientType || 'ALL'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {log.scheduledAt ? `Scheduled: ${new Date(log.scheduledAt).toLocaleString()}` : new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-600 block">{readPct}% Delivered & Read ({readCount}/{totalRecipients})</span>
                          <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${readPct}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => setSelectedNotification(log)}
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs rounded-lg inline-flex items-center gap-1 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Track Status</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Send Alert Modal */}
        {showSendModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowSendModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Send Broadcast Notification</h3>
                <button onClick={() => setShowSendModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSendAlert} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notification Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent Exam Hall Allocation Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Recipient Group</label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold"
                  >
                    <option value="ALL_STUDENTS">All Students</option>
                    <option value="ALL_TEACHERS">All Faculty Teachers</option>
                    <option value="COLLEGE_WIDE">Entire College Community</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Scheduled Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank to dispatch instantly.</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter full notification body message..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Dispatch Alert
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Recipient Delivery Track Modal */}
        {selectedNotification && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setSelectedNotification(null)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recipient Delivery Tracking</h3>
                <button onClick={() => setSelectedNotification(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{selectedNotification.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{selectedNotification.content}</p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-900 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Recipient Delivery Logs</span>
                  {(selectedNotification.recipients || []).length === 0 ? (
                    <p className="text-xs text-slate-400">All targeted users notified via WebSocket broadcast.</p>
                  ) : (
                    (selectedNotification.recipients || []).map((r: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{r.user?.name || `Recipient ${idx + 1}`}</span>
                        <Badge variant={r.isRead ? 'success' : 'secondary'} className="text-[9px]">
                          {r.isRead ? 'Read' : 'Delivered'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
