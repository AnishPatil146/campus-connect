'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { AlertCircle, Activity, Filter, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';

interface AlertStudent {
  id: string;
  name: string;
  department: string;
  attendance: number;
  status: 'AT RISK' | 'WARNING';
}

export default function AdminAttendancePage() {
  useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Filter for low attendance alerts
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'AT_RISK' | 'WARNING'>('ALL');

  // Seeded/Mock Admin statistics matching specifications
  const stats = {
    collegeAttendance: 92,
    studentsBelow75: 145,
    departmentsCount: 12,
  };

  const departments = [
    { name: 'Computer Science (CS)', percentage: 94 },
    { name: 'Information Technology (IT)', percentage: 91 },
    { name: 'Artificial Intelligence (AI)', percentage: 89 },
  ];

  const initialAlerts: AlertStudent[] = [
    { id: 'al-1', name: 'Anish Patil', department: 'CS', attendance: 68, status: 'AT RISK' },
    { id: 'al-2', name: 'Rahul Sharma', department: 'IT', attendance: 72, status: 'WARNING' },
    { id: 'al-3', name: 'Jordan Patel', department: 'AI', attendance: 64, status: 'AT RISK' },
    { id: 'al-4', name: 'Ryan Gosling', department: 'CS', attendance: 74, status: 'WARNING' },
  ];

  const [alerts] = useState<AlertStudent[]>(initialAlerts);
  const [sentAlerts, setSentAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Keep ticking counter updated
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshAdminData = async () => {
    setLoading(true);
    try {
      // Simulate API load
      await new Promise(resolve => setTimeout(resolve, 600));
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Socket connection for real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      refreshAdminData();
    };
    socket.on('attendanceUpdate', handleUpdate);
    return () => {
      socket.off('attendanceUpdate', handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleSendNotification = (studentId: string) => {
    setSentAlerts(prev => [...prev, studentId]);
    // Simulate real-time socket alert emission
    if (socket) {
      socket.emit('adminSendAlert', { studentId });
    }
    alert('Real-time attendance alert sent to the student and their parent/guardian!');
  };

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'ALL') return true;
    if (alertFilter === 'AT_RISK') return a.status === 'AT RISK';
    if (alertFilter === 'WARNING') return a.status === 'WARNING';
    return true;
  });

  // Donut parameters
  const circ = 2 * Math.PI * 30; // Radius = 30 -> Circ ≈ 188.5
  // Segment lengths corresponding to ratios: Present=92%, Absent=6%, Leave=2%
  const presentVal = (92 / 100) * circ;
  const absentVal = (6 / 100) * circ;
  const leaveVal = (2 / 100) * circ;

  return (
    <DashboardLayout title="Attendance Command Center" icon={<Activity className="h-6 w-6 text-purple-600" />}>
      <div className="space-y-6">
        
        {/* Real-time Indicator Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/5 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-250/20 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Command Center Live Connection
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring entire college. Updated {secondsAgo === 0 ? 'just' : `${secondsAgo} seconds`} ago ({lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAdminData}
              className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white dark:bg-slate-950 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl">
              Purple theme: Command Active
            </div>
          </div>
        </div>

        {/* TOP SECTION: College Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm relative overflow-hidden group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 flex items-center justify-center font-bold">
                %
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  College Attendance
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {stats.collegeAttendance}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Students below 75%
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {stats.studentsBelow75}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 flex items-center justify-center font-bold">
                D
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Active Departments
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {stats.departmentsCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ratio Pie/Donut Chart */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Attendance Distribution
              </CardTitle>
              <p className="text-[10px] text-slate-400">Total recorded lecture status ratios</p>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-6 p-5">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Present Segment */}
                  <circle
                    cx="56"
                    cy="56"
                    r="30"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="10"
                    strokeDasharray={`${presentVal} ${circ}`}
                    strokeDashoffset="0"
                  />
                  {/* Absent Segment */}
                  <circle
                    cx="56"
                    cy="56"
                    r="30"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray={`${absentVal} ${circ}`}
                    strokeDashoffset={`-${presentVal}`}
                  />
                  {/* Leave Segment */}
                  <circle
                    cx="56"
                    cy="56"
                    r="30"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${leaveVal} ${circ}`}
                    strokeDashoffset={`-${presentVal + absentVal}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-slate-800 dark:text-white">92%</span>
                  <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Present</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-3 flex-1 max-w-[200px]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/20 dark:bg-purple-950/10">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500 block"></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Present</span>
                  </div>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">92%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/20 dark:bg-red-950/10">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 block"></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Absent</span>
                  </div>
                  <span className="text-xs font-black text-red-655 dark:text-red-400">6%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/20 dark:bg-amber-950/10">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block"></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Leave</span>
                  </div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">2%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Department Comparison
              </CardTitle>
              <p className="text-[10px] text-slate-400">Comparing core department attendance rates</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {departments.map((dept, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{dept.name}</span>
                    <span className="font-black text-purple-500">{dept.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 shadow-sm shadow-purple-500/10 transition-all duration-700"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: LOW ATTENDANCE ALERTS */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-805 dark:text-slate-200">
                Low Attendance Alerts
              </CardTitle>
              <p className="text-[10px] text-slate-400">Students flagged below the 75% required rate</p>
            </div>
            
            {/* Filter controls */}
            <div className="flex items-center gap-1.5 self-start">
              <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
              {(['ALL', 'AT_RISK', 'WARNING'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAlertFilter(mode)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all ${
                    alertFilter === mode
                      ? 'bg-purple-650 hover:bg-purple-700 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6">Department</th>
                      <th className="py-3 px-6">Attendance Rate</th>
                      <th className="py-3 px-6">Alert Category</th>
                      <th className="py-3 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {filteredAlerts.map((alt) => {
                      const isRisk = alt.status === 'AT RISK';
                      const wasSent = sentAlerts.includes(alt.id);
                      return (
                        <tr key={alt.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {alt.name}
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-slate-650 dark:text-slate-400 text-xs">
                            {alt.department}
                          </td>
                          <td className={`py-3.5 px-6 font-black text-xs ${isRisk ? 'text-red-505' : 'text-amber-600'}`}>
                            {alt.attendance}%
                          </td>
                          <td className="py-3.5 px-6">
                            <Badge variant={isRisk ? 'danger' : 'warning'} className="text-[9px]">
                              {alt.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => handleSendNotification(alt.id)}
                              disabled={wasSent}
                              className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                wasSent
                                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600'
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-750 active:scale-[0.97] dark:bg-purple-950/20 dark:text-purple-400'
                              }`}
                            >
                              <Send className="h-2.5 w-2.5" />
                              {wasSent ? 'Alerted' : 'Notify'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mt-3">
                  No attendance alerts.
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  All active logs for flagged filters are clear.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
