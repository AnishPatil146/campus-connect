'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Modal, Badge } from '@campus-connect/ui';
import { CheckCircle2, AlertCircle, AlertTriangle, Coffee, Plus } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { api } from '../../../../utils/api';

interface AttendanceLog {
  day: number;
  status: 'present' | 'absent' | 'leave' | 'holiday';
  reason?: string;
  approvalStatus?: string;
  recordId?: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Leave Request States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Correction Request States
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  // Calendar days template for July 2026
  // July 2026 starts on Wednesday (1st)
  // We represent empty slots for Mon, Tue with null
  const defaultCalendarDays: (AttendanceLog | null)[] = [
    null, // Mon
    null, // Tue
    { day: 1, status: 'present' },
    { day: 2, status: 'present' },
    { day: 3, status: 'absent', reason: 'No Attendance Recorded - Unexcused' },
    { day: 4, status: 'present' },
    { day: 5, status: 'leave', reason: 'Medical Checkup - Approved by Class Teacher', approvalStatus: 'Approved Leave' },
    { day: 6, status: 'present' },
    { day: 7, status: 'present' },
    { day: 8, status: 'present' },
    { day: 9, status: 'holiday', reason: 'Local Festival Holiday' },
    { day: 10, status: 'present' },
    { day: 11, status: 'holiday', reason: 'Weekend/Monsoon Rain Holiday' },
    { day: 12, status: 'holiday', reason: 'Sunday Holiday' },
    { day: 13, status: 'present' },
    { day: 14, status: 'present' },
    { day: 15, status: 'present' },
    { day: 16, status: 'present' },
    { day: 17, status: 'present' },
    { day: 18, status: 'holiday', reason: 'Saturday Holiday' },
    { day: 19, status: 'holiday', reason: 'Sunday Holiday' },
    { day: 20, status: 'present' },
    { day: 21, status: 'present' },
    { day: 22, status: 'present' },
    { day: 23, status: 'present' },
    { day: 24, status: 'present' },
    { day: 25, status: 'holiday', reason: 'Saturday Holiday' },
    { day: 26, status: 'holiday', reason: 'Sunday Holiday' },
    { day: 27, status: 'present' },
    { day: 28, status: 'present' },
    { day: 29, status: 'absent', reason: 'Late Arrival - Flagged Absent' },
    { day: 30, status: 'present' },
    { day: 31, status: 'present' }
  ];

  const [calendar, setCalendar] = useState<(AttendanceLog | null)[]>(defaultCalendarDays);

  const fetchLiveAttendance = async () => {
    if (!user?.studentProfile?.id) return;
    setLoading(true);
    try {
      const res = await api.getStudentAttendance(user.studentProfile.id);
      if (res.success && res.data && res.data.length > 0) {
        const updatedCalendar = [...defaultCalendarDays];
        res.data.forEach((record: any) => {
          const session = record.attendanceSession;
          if (!session || !session.attendanceDate) return;
          const date = new Date(session.attendanceDate);
          
          // Match July 2026
          if (date.getFullYear() === 2026 && date.getMonth() === 6) {
            const dayNum = date.getDate();
            const idx = updatedCalendar.findIndex(item => item && item.day === dayNum);
            if (idx !== -1) {
              const dbStatus = record.status;
              const mappedStatus = dbStatus === 'PRESENT' || dbStatus === 'LATE' ? 'present' :
                                   dbStatus === 'ABSENT' ? 'absent' :
                                   dbStatus === 'LEAVE' || dbStatus === 'MEDICAL' || dbStatus === 'EXCUSED' ? 'leave' : 'holiday';

              updatedCalendar[idx] = {
                day: dayNum,
                status: mappedStatus as any,
                reason: record.remarks || `${session.subject?.name || 'Lecture'} (${session.startTime || ''}-${session.endTime || ''})`,
                recordId: record.id,
              };
            }
          }
        });
        setCalendar(updatedCalendar);
      }
    } catch (err) {
      console.error('Failed to load student attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAttendance();
  }, [user]);

  // Statistics derived dynamically
  const present = calendar.filter(c => c && c.status === 'present').length;
  const absent = calendar.filter(c => c && c.status === 'absent').length;
  const leave = calendar.filter(c => c && c.status === 'leave').length;
  const holiday = calendar.filter(c => c && c.status === 'holiday').length;

  const total = present + absent + leave;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 87;

  const handleDateClick = (log: AttendanceLog | null) => {
    if (!log) return;
    setSelectedLog(log);
    setCorrectionReason('');
    setCorrectionSuccess(false);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10';
      case 'absent': return 'bg-red-500 hover:bg-red-600 shadow-red-500/10';
      case 'leave': return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10';
      case 'holiday': return 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600';
      default: return 'bg-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'leave': return 'Leave (Excused)';
      case 'holiday': return 'Holiday / Off-day';
      default: return 'Unknown';
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.studentProfile?.id) return;
    setLeaveSubmitting(true);
    const result = await api.requestLeave({
      studentId: user.studentProfile.id,
      leaveType,
      fromDate,
      toDate,
      reason: leaveReason,
    });
    setLeaveSubmitting(false);
    if (result.success) {
      alert('Leave request submitted successfully!');
      setIsLeaveModalOpen(false);
      // Reset
      setLeaveReason('');
      setFromDate('');
      setToDate('');
    } else {
      alert(result.message || 'Failed to submit leave request');
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog?.recordId) return;
    setCorrectionSubmitting(true);
    const result = await api.requestCorrection({
      attendanceRecordId: selectedLog.recordId,
      reason: correctionReason,
    });
    setCorrectionSubmitting(false);
    if (result.success) {
      setCorrectionSuccess(true);
    } else {
      alert(result.message || 'Failed to submit correction request');
    }
  };

  return (
    <DashboardLayout title="Attendance Tracker">
      <div className="space-y-6">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Track and Manage Attendance</h3>
            <p className="text-[10px] text-slate-405 mt-0.5">Submit leave applications or correction requests directly</p>
          </div>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            Request Leave
          </button>
        </div>

        {/* Attendance overview card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Overall Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{percentage}%</span>
              <Badge variant={percentage >= 75 ? 'success' : 'danger'} className="text-xs">
                {percentage >= 75 ? 'Safe' : 'Low'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Minimum required: 75%</p>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Present Days</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-450">{present}</span>
              <span className="text-xs text-slate-455">Lectures</span>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Fully recorded present</p>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Absent Days</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-red-650 dark:text-red-450">{absent}</span>
              <span className="text-xs text-slate-455">Lectures</span>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Requires teacher note</p>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Approved Leave</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{leave}</span>
              <span className="text-xs text-slate-455">Day(s)</span>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Excused absence</p>
          </Card>

        </div>

        {/* Calendar and Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Attendance Calendar Grid (July 2026) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>📅 July 2026 Calendar</CardTitle>
                <p className="text-xs text-slate-500">Tap a color-coded date box to view attendance details and status logs</p>
              </div>
              <Badge variant="primary" className="text-xs uppercase font-bold px-3 py-1">July 2026</Badge>
            </CardHeader>
            <CardContent>
              {/* Day Titles */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Grid Box list */}
              <div className="grid grid-cols-7 gap-2">
                {calendar.map((log, idx) => {
                  if (!log) {
                    return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 dark:bg-slate-900/5 rounded-xl border border-transparent" />;
                  }

                  return (
                    <button
                      key={`day-${log.day}`}
                      onClick={() => handleDateClick(log)}
                      className={`aspect-square rounded-xl flex flex-col justify-between p-2 text-white font-bold text-xs shadow-sm transition-all duration-200 active:scale-[0.93] ${getStatusColor(log.status)}`}
                    >
                      <span className="self-start">{log.day}</span>
                      <span className="self-end text-[7px] font-extrabold uppercase tracking-wide opacity-90 hidden sm:inline">
                        {log.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Legend Box */}
              <div className="border-t border-slate-50 dark:border-slate-900 mt-6 pt-4 flex flex-wrap gap-4 items-center justify-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">🟢 Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-red-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">🔴 Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">🟡 Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">⚪ Holiday / Off-day</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Breakdown Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Monthly Statistics</CardTitle>
                <p className="text-xs text-slate-500">Summary breakdown of July 2026 recordings</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Present Classes</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{present} Lectures</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Absent Classes</span>
                  <span className="text-xs font-bold text-red-650 dark:text-red-450">{absent} Lectures</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Approved Leaves</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{leave} Day(s)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Holidays</span>
                  <span className="text-xs font-bold text-slate-550 dark:text-slate-400">{holiday} Days</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Date Detail Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Attendance Details: ${selectedLog?.day || ''} July 2026`}
          size="sm"
          footer={
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Close
            </button>
          }
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                  {selectedLog.status === 'present' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {selectedLog.status === 'absent' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {selectedLog.status === 'leave' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {selectedLog.status === 'holiday' && <Coffee className="h-5 w-5 text-slate-400" />}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Status</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{getStatusText(selectedLog.status)}</span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-50 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Description / Note</span>
                  <p className="text-xs text-slate-650 dark:text-slate-350 mt-1 font-medium">{selectedLog.reason}</p>
                </div>
              )}

              {selectedLog.approvalStatus && (
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/30">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-450">Approval Status</span>
                  <Badge variant="success" className="text-[10px]">{selectedLog.approvalStatus}</Badge>
                </div>
              )}

              {selectedLog.status === 'absent' && selectedLog.recordId && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Request Attendance Correction</span>
                  {correctionSuccess ? (
                    <Badge variant="success" className="mt-2 text-xs">Correction Request Submitted</Badge>
                  ) : (
                    <form onSubmit={handleCorrectionSubmit} className="space-y-3 mt-2">
                      <textarea
                        required
                        placeholder="Provide reason for correction (e.g. 'I was present but marked absent')"
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={correctionSubmitting}
                        className="w-full py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl transition-all"
                      >
                        {correctionSubmitting ? 'Submitting...' : 'Submit Correction Request'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Leave Application Modal */}
        <Modal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          title="Apply for Leave / Excused Absence"
          size="sm"
          footer={
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
          }
        >
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</label>
              <select
                className="h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 font-semibold focus:outline-none"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Medical">Medical Leave</option>
                <option value="Duty Leave">Duty Leave</option>
                <option value="Other">Other Excused Absence</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 font-semibold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                <input
                  type="date"
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Leave</label>
              <textarea
                required
                placeholder="Explain the reason for absence..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={leaveSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
            >
              {leaveSubmitting ? 'Submitting Application...' : 'Submit Leave Application'}
            </button>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
