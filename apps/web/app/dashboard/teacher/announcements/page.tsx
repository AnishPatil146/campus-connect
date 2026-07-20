'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { useLoading } from '../../../../components/LoadingProvider';
import { api } from '../../../../utils/api';
import { Megaphone, Plus, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeacherAnnouncementsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startLoading, stopLoading } = useLoading();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [priority, setPriority] = useState('MEDIUM');
  const [target, setTarget] = useState('ALL');

  // Alert states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewAnnouncement = () => fetchAnnouncements();
      socket.on('announcement:new', handleNewAnnouncement);
      return () => {
        socket.off('announcement:new', handleNewAnnouncement);
      };
    }
  }, [socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    startLoading('Publishing announcement...');
    try {
      const res = await api.createAnnouncement({
        title,
        content,
        category,
        target,
        status: 'PUBLISHED',
        priority,
      });

      if (res.success) {
        setSuccessMsg(`Announcement "${title}" published successfully.`);
        setTitle('');
        setContent('');
        setShowCreateModal(false);
        fetchAnnouncements();
      } else {
        setErrorMsg(res.message || 'Failed to publish announcement.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing announcement.');
    } finally {
      stopLoading();
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  return (
    <DashboardLayout title="Academic Announcements" icon={<Megaphone className="h-6 w-6 text-emerald-500" />}>
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

        <div className="relative rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Announcements Bulletin</h3>
            <p className="text-xs text-slate-500 mt-1">Broadcast important notifications and semester alerts to students.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Announcement
          </button>
        </div>

        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Bulletin Board</CardTitle>
            <p className="text-xs text-slate-500">Live list of active announcements across the college database.</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/5">
                <Megaphone className="h-10 w-10 text-slate-350 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 font-bold">No announcements found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click "Create Announcement" above to broadcast a notice.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/5 flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="primary" className="text-[9px] font-bold">
                          {ann.category}
                        </Badge>
                        {ann.priority === 'HIGH' && (
                          <Badge variant="danger" className="text-[9px] font-bold">
                            Urgent Priority
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{ann.title}</h4>
                      <p className="text-xs text-slate-655 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showCreateModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowCreateModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Notice</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Publish alerts to students and staff</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Notice Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Midterm Examination Schedule Release"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Content Body
                  </label>
                  <textarea
                    placeholder="Write detailed notice information..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    >
                      <option value="ACADEMIC">Academic</option>
                      <option value="EVENT">Event</option>
                      <option value="GENERAL">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Target Audience
                    </label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    >
                      <option value="ALL">All College</option>
                      <option value="STUDENTS">Students Only</option>
                      <option value="TEACHERS">Teachers Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 h-10 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
                  >
                    Publish Notice
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
