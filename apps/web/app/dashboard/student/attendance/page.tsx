'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Modal, Badge } from '@campus-connect/ui';
import { CheckCircle2, AlertCircle, AlertTriangle, Coffee } from 'lucide-react';

interface AttendanceLog {
  day: number;
  status: 'present' | 'absent' | 'leave' | 'holiday';
  reason?: string;
  approvalStatus?: string;
}

export default function AttendancePage() {
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Statistics
  const stats = {
    percentage: 87,
    present: 22,
    absent: 2,
    leave: 1,
    holiday: 5,
  };

  // Calendar mapping for July 2026
  // July 2026 starts on Wednesday (1st)
  // We represent empty slots for Mon, Tue with null
  const calendarDays: (AttendanceLog | null)[] = [
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

  const handleDateClick = (log: AttendanceLog | null) => {
    if (!log) return;
    setSelectedLog(log);
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

  return (
    <DashboardLayout title="Attendance Tracker">
      <div className="space-y-6">
        
        {/* Attendance overview card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Overall Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.percentage}%</span>
              <Badge variant="success" className="text-xs">Safe</Badge>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Minimum required: 75%</p>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Present Days</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-450">{stats.present}</span>
              <span className="text-xs text-slate-450">Lectures</span>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Fully recorded present</p>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Absent Days</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-red-650 dark:text-red-450">{stats.absent}</span>
              <span className="text-xs text-slate-450">Lectures</span>
            </div>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1">Requires teacher note</p>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-slate-100 bg-white dark:bg-slate-950">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Approved Leave</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.leave}</span>
              <span className="text-xs text-slate-450">Day</span>
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
                {calendarDays.map((log, idx) => {
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
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.present} Lectures</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Absent Classes</span>
                  <span className="text-xs font-bold text-red-650 dark:text-red-450">{stats.absent} Lectures</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Approved Leaves</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{stats.leave} Day</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Holidays</span>
                  <span className="text-xs font-bold text-slate-550 dark:text-slate-400">{stats.holiday} Days</span>
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
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}
