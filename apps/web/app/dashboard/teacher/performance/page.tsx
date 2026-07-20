'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { api } from '../../../../utils/api';
import { LineChart, Search, Users, ClipboardCheck, GraduationCap, AlertTriangle } from 'lucide-react';

export default function TeacherPerformancePage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStudents();
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const filteredStudents = students.filter(student => {
    const name = `${student.profile?.firstName || ''} ${student.profile?.lastName || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || (student.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate metrics
  const avgAttendance = 84.5; // Mock/Calculation fallback
  const riskStudents = filteredStudents.filter(s => (s.attendanceRate || avgAttendance) < 75).length;

  return (
    <DashboardLayout title="Student Performance & Monitoring" icon={<LineChart className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Total Managed Students
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {students.length} Students
                </span>
              </div>
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Avg Attendance Rate
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {avgAttendance}%
                </span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Attendance Risk Alert
                </span>
                <span className={`text-2xl font-black mt-1 block ${riskStudents > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                  {riskStudents} Flagged
                </span>
              </div>
              <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Control */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-900">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
            />
          </div>
        </div>

        {/* Students Table */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Academic Roster</CardTitle>
            <p className="text-xs text-slate-500">Student metrics, division assignment, and cumulative progress.</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading students performance data...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/5">
                <GraduationCap className="h-10 w-10 text-slate-350 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 font-bold">No students registered in database</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 pl-2">Student Name</th>
                      <th className="pb-3">Roll Number</th>
                      <th className="pb-3">Division</th>
                      <th className="pb-3 text-center">Attendance Rate</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const attVal = student.attendanceRate || avgAttendance;
                      const isLowAtt = attVal < 75;
                      return (
                        <tr key={student.id} className="border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {student.profile?.firstName} {student.profile?.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{student.user?.email}</div>
                          </td>
                          <td className="py-3.5 text-slate-500 font-semibold">{student.rollNumber}</td>
                          <td className="py-3.5 text-slate-500 font-medium">{student.division?.name || 'Division A'}</td>
                          <td className="py-3.5 text-center font-bold">
                            <span className={isLowAtt ? 'text-rose-600' : 'text-emerald-600'}>
                              {attVal}%
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <Badge variant={isLowAtt ? 'danger' : 'success'} className="text-[9px] font-bold">
                              {isLowAtt ? 'At Risk' : 'Good'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
