'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { useLoading } from '../../../../components/LoadingProvider';
import { api } from '../../../../utils/api';
import { Calendar, Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function TeacherLeavePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startLoading, stopLoading } = useLoading();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    if (!user?.teacherProfile?.id) return;
    setIsLoading(true);
    try {
      const res = await api.getTeacherLeaves(user.teacherProfile.id);
      if (res.success && res.data) {
        setLeaves(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.teacherProfile?.id]);

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user, fetchLeaves]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchLeaves();
    socket.on('teacher.leave_approved', handleUpdate);
    socket.on('teacher.leave_requested', handleUpdate);
    return () => {
      socket.off('teacher.leave_approved', handleUpdate);
      socket.off('teacher.leave_requested', handleUpdate);
    };
  }, [socket, fetchLeaves]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !startDate || !endDate || !user?.teacherProfile?.id) return;

    startLoading('Submitting leave request...');
    try {
      const res = await api.requestTeacherLeave(user.teacherProfile.id, {
        leaveType,
        reason,
        startDate,
        endDate,
      });

      if (res.success) {
        setSuccessMsg('Leave application submitted! Awaiting administrator approval.');
        setReason('');
        setStartDate('');
        setEndDate('');
        setShowModal(false);
        fetchLeaves();

        if (socket) {
          socket.emit('teacher.leave_requested', res.data);
        }
      } else {
        setErrorMsg(res.message || 'Failed to submit leave request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting leave request.');
    } finally {
      stopLoading();
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  return (
    <DashboardLayout title="Faculty Leave Center" icon={<Calendar className="h-6 w-6 text-emerald-500" />}>
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

        {/* Header banner */}
        <div className="relative rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Leave Application Center</h3>
            <p className="text-xs text-slate-500 mt-1">Submit leave requests for approval by college administration.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            Apply for Leave
          </button>
        </div>

        {/* Leave Table / Card */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle>My Leave Applications</CardTitle>
            <p className="text-xs text-slate-500">Track current and historical leave applications</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading leave history...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/5">
                <Calendar className="h-10 w-10 text-slate-350 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 font-bold">No leave applications found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click "Apply for Leave" above to request time off.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((l) => (
                  <div key={l.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{l.leaveType} LEAVE</span>
                        <Badge
                          variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {l.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">{l.reason}</p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        {showModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Faculty Leave Application</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:bg-slate-100">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                  >
                    <option value="CASUAL">Casual Leave (CL)</option>
                    <option value="MEDICAL">Medical / Sick Leave</option>
                    <option value="DUTY">On Duty (OD)</option>
                    <option value="EARNED">Earned Leave (EL)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Reason for Leave
                  </label>
                  <textarea
                    placeholder="Provide official reason for time off request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 h-10 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-655"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    Submit Application
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
