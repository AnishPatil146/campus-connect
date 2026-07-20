'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Modal, Badge } from '@campus-connect/ui';
import { Check, X, AlertTriangle, Calendar, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';

interface AttendanceLog {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';
  subjectName: string;
  remarks?: string;
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Leave & Correction Modal States
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);



  // Active month in the line chart
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);

  // Statistics from database
  const [stats, setStats] = useState({
    percentage: 0,
    present: 0,
    absent: 0,
    medicalLeaves: 0,
  });

  const [subjects, setSubjects] = useState<{ name: string; percentage: number; present: number; total: number }[]>([]);

  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; percentage: number; present: number; total: number }[]>([]);

  const [recentAttendance, setRecentAttendance] = useState<AttendanceLog[]>([]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const dbRes = await api.getStudentAttendanceDashboard();
      if (dbRes.success && dbRes.data) {
        const d = dbRes.data;
        setStats({
          percentage: d.percentage ?? 0,
          present: d.present ?? 0,
          absent: d.absent ?? 0,
          medicalLeaves: d.medicalLeaves ?? 0,
        });

        if (d.subjectWise && d.subjectWise.length > 0) {
          const mappedSubjects = d.subjectWise.map((s: any) => ({
            name: s.subjectName,
            percentage: Math.round(s.percentage),
            present: s.present,
            total: s.present + s.absent,
          }));
          setSubjects(mappedSubjects);
        } else {
          setSubjects([]);
        }

        if (d.monthlyTrend && d.monthlyTrend.length > 0) {
          const mappedTrend = d.monthlyTrend.map((m: any) => ({
            month: m.month,
            percentage: Math.round(m.percentage),
            present: m.present || 0,
            total: m.total || 0,
          }));
          setMonthlyTrend(mappedTrend);
          setActiveMonthIdx(mappedTrend.length - 1);
        } else {
          setMonthlyTrend([]);
          setActiveMonthIdx(0);
        }

        if (d.history && d.history.length > 0) {
          const mappedHistory = d.history.slice(0, 4).map((h: any, idx: number) => {
            const dateObj = new Date(h.date);
            let label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            if (idx === 0) label = 'Today';
            else if (idx === 1) label = 'Yesterday';
            return {
              date: label,
              status: h.status,
              subjectName: h.subjectName,
              remarks: h.remarks || '',
            };
          });
          setRecentAttendance(mappedHistory);
        } else {
          setRecentAttendance([]);
        }
      }
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (e) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Real-time ticking counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchAttendanceData();
    };
    socket.on('attendanceUpdate', handleUpdate);
    return () => {
      socket.off('attendanceUpdate', handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Form handlers
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.studentProfile?.id) return;
    setLeaveSubmitting(true);
    try {
      const res = await api.requestLeave({
        studentId: user.studentProfile.id,
        leaveType,
        fromDate,
        toDate,
        reason: leaveReason,
      });
      if (res.success) {
        setIsLeaveOpen(false);
        setLeaveReason('');
        setFromDate('');
        setToDate('');
        fetchAttendanceData();
      } else {
        alert(res.message || 'Failed to submit leave request');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLeaveSubmitting(false);
    }
  };



  // SVGs Progress Ring Parameters
  const radius = 34;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  if (loading) {
    return (
      <DashboardLayout title="Attendance Overview" icon={<Calendar className="h-6 w-6 text-blue-600" />}>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading attendance records...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance Overview" icon={<Calendar className="h-6 w-6 text-blue-600" />}>
      <div className="space-y-6">
        
        {/* Real-time Indicator Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/5 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-250/20 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Live Attendance Connection
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Updated {secondsAgo === 0 ? 'just' : `${secondsAgo} seconds`} ago ({lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAttendanceData()}
              className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsLeaveOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Apply Leave
            </button>
          </div>
        </div>

        {/* TOP SECTION: Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Circular Progress Ring */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm relative overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Overall Attendance
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 block">
                  {stats.percentage}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 block">
                  Min Required: 75%
                </span>
              </div>
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-18 h-18 transform -rotate-90">
                  <circle
                    className="text-slate-100 dark:text-slate-850"
                    strokeWidth={stroke}
                    stroke="currentColor"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  <circle
                    className="text-blue-500 transition-all duration-1000 ease-out"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-blue-500">
                  {stats.percentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Present Days */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Present Days
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 block">
                {stats.present}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 block">
                Recorded lectures attended
              </span>
            </CardContent>
          </Card>

          {/* Card 3: Absent Days */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Absent Days
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 block">
                {stats.absent}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 block">
                Unexcused session misses
              </span>
            </CardContent>
          </Card>

          {/* Card 4: Medical Leaves */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Medical Leaves
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 block">
                {stats.medicalLeaves}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 block">
                Approved leaves of absence
              </span>
            </CardContent>
          </Card>
        </div>

        {/* SUBJECT-WISE ATTENDANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Subject-Wise Attendance
              </CardTitle>
              <p className="text-[10px] text-slate-400">Aggregate lecture summary breakdown</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.map((sub, idx) => {
                const isLow = sub.percentage < 75;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</span>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[8px] bg-red-50 text-red-655 border border-red-150 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
                            <AlertTriangle className="h-2 w-2" /> Low Attendance
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{sub.present}/{sub.total} lectures</span>
                        <span className={`font-black ${isLow ? 'text-red-500' : 'text-blue-500'}`}>
                          {sub.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isLow ? 'bg-red-500 shadow-sm shadow-red-500/10' : 'bg-blue-500 shadow-sm shadow-blue-500/10'
                        }`}
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* MONTHLY ATTENDANCE GRAPH: Interactive Line Chart */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Monthly Attendance Trend
              </CardTitle>
              <p className="text-[10px] text-slate-400">Interactive SVG line breakdown</p>
            </CardHeader>
            <CardContent className="flex flex-col justify-between min-h-[220px] p-5 pt-2">
              <div className="relative w-full h-32 flex items-end">
                {(() => {
                  const points = monthlyTrend.length > 0 
                    ? monthlyTrend.map((item, idx) => {
                        const x = 50 + (idx / Math.max(1, monthlyTrend.length - 1)) * 300;
                        const y = 110 - (item.percentage / 100) * 80;
                        return { x, y };
                      })
                    : [];

                  const linePath = points.length > 0 ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') : 'M 50,110 L 350,110';
                  const areaPath = points.length > 0 
                    ? `${linePath} L ${points[points.length - 1].x},120 L ${points[0].x},120 Z`
                    : 'M 50,110 L 350,110 L 350,120 L 50,120 Z';

                  return (
                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-900" />
                      <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-900" />
                      <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-900" />

                      {/* Gradient Area under line */}
                      <path
                        d={areaPath}
                        fill="url(#areaGrad)"
                      />

                      {/* Connecting Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Hoverable Nodes */}
                      {points.map((node, i) => (
                        <g key={i} className="cursor-pointer" onClick={() => setActiveMonthIdx(i)}>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={activeMonthIdx === i ? 6 : 4}
                            fill={activeMonthIdx === i ? '#3b82f6' : '#fff'}
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            className="transition-all duration-300"
                          />
                        </g>
                      ))}
                    </svg>
                  );
                })()}

                {/* Popover tooltip */}
                {monthlyTrend.length > 0 && monthlyTrend[activeMonthIdx] && (
                  <div className="absolute top-2 right-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] rounded-xl px-2.5 py-1.5 shadow font-semibold">
                    <span className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">
                      {monthlyTrend[activeMonthIdx].month}
                    </span>
                    <span className="text-xs font-black text-blue-400 mt-0.5 block">
                      {monthlyTrend[activeMonthIdx].percentage}% Attendance
                    </span>
                    <span className="block text-[8px] mt-0.5 text-slate-400">
                      {monthlyTrend[activeMonthIdx].present}/{monthlyTrend[activeMonthIdx].total} classes
                    </span>
                  </div>
                )}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between px-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-4">
                {monthlyTrend.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMonthIdx(i)}
                    className={`transition-all duration-200 ${
                      activeMonthIdx === i ? 'text-blue-500 scale-105' : 'hover:text-slate-600'
                    }`}
                  >
                    {m.month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RECENT ATTENDANCE */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Recent Attendance
            </CardTitle>
            <p className="text-[10px] text-slate-400">Recent logging session history</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {recentAttendance.map((log, idx) => {
                const isPresent = log.status === 'PRESENT' || log.status === 'LATE';
                return (
                  <div key={idx} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-7 w-7 rounded-xl flex items-center justify-center border shrink-0 ${
                          isPresent
                            ? 'bg-blue-50/50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                            : 'bg-red-50/50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
                        }`}
                      >
                        {isPresent ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                          {log.subjectName}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {log.date} • {log.remarks || 'Recorded session'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={isPresent ? 'success' : 'danger'} className="text-[10px] px-2 py-0.5">
                      {log.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leave application Modal */}
        <Modal
          isOpen={isLeaveOpen}
          onClose={() => setIsLeaveOpen(false)}
          title="Apply for Leave / Excused Absence"
          size="sm"
          footer={
            <button
              onClick={() => setIsLeaveOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
          }
        >
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Leave Type
              </label>
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
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 font-semibold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  To Date
                </label>
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
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Reason for Leave
              </label>
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
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
            >
              {leaveSubmitting ? 'Submitting Application...' : 'Submit Leave Application'}
            </button>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
