'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { Clock, BookOpen, AlertCircle, Save, RotateCcw, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';

interface StudentAttendanceState {
  id: string;
  name: string;
  prn: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL';
}

interface ClassSession {
  id: string;
  subjectName: string;
  semester: number;
  room: string;
  timeSlot: string;
  pending: boolean;
}

export default function TeacherAttendancePage() {
  useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Today's classes state
  const [classes, setClasses] = useState<ClassSession[]>([
    { id: 'class-1', subjectName: 'DBMS', semester: 3, room: 'Room 204', timeSlot: '09:00 AM - 10:00 AM', pending: true },
    { id: 'class-2', subjectName: 'Operating Systems', semester: 2, room: 'Room 103', timeSlot: '10:15 AM - 11:15 AM', pending: true },
    { id: 'class-3', subjectName: 'DSA', semester: 3, room: 'Room 205', timeSlot: '01:30 PM - 02:30 PM', pending: false },
    { id: 'class-4', subjectName: 'Mathematics', semester: 1, room: 'Room 101', timeSlot: '03:00 PM - 04:00 PM', pending: false },
  ]);

  // Selected class for taking attendance
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);

  // Student list for marking attendance
  const [students, setStudents] = useState<StudentAttendanceState[]>([
    { id: 'std-1', name: 'Anish Patil', prn: 'STU-2026-089', status: 'PRESENT' },
    { id: 'std-2', name: 'Rahul Sharma', prn: 'STU-2026-104', status: 'PRESENT' },
    { id: 'std-3', name: 'Alex Rivera', prn: 'STU-2026-023', status: 'PRESENT' },
    { id: 'std-4', name: 'Jordan Patel', prn: 'STU-2026-004', status: 'ABSENT' },
    { id: 'std-5', name: 'Emma Watson', prn: 'STU-2026-112', status: 'PRESENT' },
    { id: 'std-6', name: 'Ryan Gosling', prn: 'STU-2026-187', status: 'LATE' },
    { id: 'std-7', name: 'Ankita Sen', prn: 'STU-2026-056', status: 'MEDICAL' },
  ]);

  // Original state for resetting
  const [originalStudents, setOriginalStudents] = useState<StudentAttendanceState[]>([]);

  // Statistics
  const totalClasses = classes.length;
  const pendingAttendanceCount = classes.filter(c => c.pending).length;
  const totalStudentsTaught = 240;

  useEffect(() => {
    // Keep ticking counter updated
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectClass = (cls: ClassSession) => {
    setSelectedClass(cls);
    // Load student list (mocking fetch)
    const initialStudents: StudentAttendanceState[] = [
      { id: 'std-1', name: 'Anish Patil', prn: 'PRN-2026-089', status: 'PRESENT' },
      { id: 'std-2', name: 'Rahul Sharma', prn: 'PRN-2026-104', status: 'PRESENT' },
      { id: 'std-3', name: 'Alex Rivera', prn: 'PRN-2026-023', status: 'PRESENT' },
      { id: 'std-4', name: 'Jordan Patel', prn: 'PRN-2026-004', status: 'ABSENT' },
      { id: 'std-5', name: 'Emma Watson', prn: 'PRN-2026-112', status: 'PRESENT' },
      { id: 'std-6', name: 'Ryan Gosling', prn: 'PRN-2026-187', status: 'LATE' },
      { id: 'std-7', name: 'Ankita Sen', prn: 'PRN-2026-056', status: 'MEDICAL' },
    ];
    setStudents(initialStudents);
    setOriginalStudents(JSON.parse(JSON.stringify(initialStudents)));
  };

  const handleStatusChange = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL') => {
    setStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
    );
  };

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
  };

  const handleReset = () => {
    setStudents(JSON.parse(JSON.stringify(originalStudents)));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);

    try {
      // API payload shape mapping
      const formattedRecords = students.map(s => ({
        studentId: s.id,
        status: s.status,
      }));

      // Simulate API post (fallbacks to mock store)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update the class state as not pending
      setClasses(prev =>
        prev.map(c => c.id === selectedClass.id ? { ...c, pending: false } : c)
      );

      // Trigger socket real-time update
      if (socket) {
        socket.emit('attendanceMarked', { classId: selectedClass.id, records: formattedRecords });
      }

      setLastUpdated(new Date());
      setSecondsAgo(0);
      setSelectedClass(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Attendance Work Center" icon={<BookOpen className="h-6 w-6 text-emerald-600" />}>
      <div className="space-y-6">
        
        {/* Real-time Indicator Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/5 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-250/20 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Work Center Active
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Today's logs. Updated {secondsAgo === 0 ? 'just' : `${secondsAgo} seconds`} ago ({lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white dark:bg-slate-950 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl">
            Green theme: Faculty Active
          </div>
        </div>

        {/* TOP SECTION: Today's Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center justify-center font-bold">
                C
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Today's Classes
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {totalClasses}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 flex items-center justify-center font-bold">
                P
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Attendance Pending
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {pendingAttendanceCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 flex items-center justify-center font-bold">
                S
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Assigned Students
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {totalStudentsTaught}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Navigation Content */}
        {!selectedClass ? (
          /* SECTION 2: CLASS LIST */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-405 uppercase tracking-widest">
                Today's Class Schedule
              </h3>
            </div>
            
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm">
                            {cls.subjectName}
                          </h4>
                          <Badge variant={cls.pending ? 'warning' : 'success'} className="text-[9px]">
                            {cls.pending ? 'Pending' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Semester {cls.semester} • Room {cls.room}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-2">
                          <Clock className="h-3 w-3" /> {cls.timeSlot}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleSelectClass(cls)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl active:scale-[0.98] transition-all shadow-sm ${
                          cls.pending
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                            : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cls.pending ? 'Take Attendance' : 'Review'}
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900/5 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-250 text-center">
                <AlertCircle className="h-8 w-8 text-slate-400" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mt-3">
                  No classes scheduled today.
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enjoy your day off or check your general timetable profile.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ATTENDANCE SCREEN SHEET */
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <button
                onClick={() => setSelectedClass(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Schedule
              </button>

              <div className="flex flex-wrap items-center gap-2 self-end">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 active:scale-[0.98] transition-all dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                >
                  Mark All Present
                </button>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 active:scale-[0.98] transition-all dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                >
                  <RotateCcw className="h-3 w-3 inline mr-1" />
                  Reset
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  {loading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-805 dark:text-slate-200">
                    Marking Attendance: {selectedClass.subjectName}
                  </CardTitle>
                  <p className="text-[10px] text-slate-400">
                    Semester {selectedClass.semester} • Room {selectedClass.room}
                  </p>
                </div>
                <Badge variant="primary" className="text-xs">
                  {students.length} Enrolled Students
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                        <th className="py-3 px-6">Student Name</th>
                        <th className="py-3 px-6">PRN Number</th>
                        <th className="py-3 px-6 text-center">Status Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                      {students.map((std) => (
                        <tr key={std.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="py-3 px-6 font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {std.name}
                          </td>
                          <td className="py-3 px-6 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {std.prn}
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center justify-center gap-1">
                              {/* PRESENT Button */}
                              <button
                                onClick={() => handleStatusChange(std.id, 'PRESENT')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  std.status === 'PRESENT'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                    : 'bg-slate-50 text-slate-400 border border-transparent dark:bg-slate-900/40 hover:text-slate-600'
                                }`}
                              >
                                Present
                              </button>

                              {/* ABSENT Button */}
                              <button
                                onClick={() => handleStatusChange(std.id, 'ABSENT')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  std.status === 'ABSENT'
                                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
                                    : 'bg-slate-50 text-slate-400 border border-transparent dark:bg-slate-900/40 hover:text-slate-600'
                                }`}
                              >
                                Absent
                              </button>

                              {/* LATE Button */}
                              <button
                                onClick={() => handleStatusChange(std.id, 'LATE')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  std.status === 'LATE'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                                    : 'bg-slate-50 text-slate-400 border border-transparent dark:bg-slate-900/40 hover:text-slate-600'
                                }`}
                              >
                                Late
                              </button>

                              {/* MEDICAL LEAVE Button */}
                              <button
                                onClick={() => handleStatusChange(std.id, 'MEDICAL')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  std.status === 'MEDICAL'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900'
                                    : 'bg-slate-50 text-slate-400 border border-transparent dark:bg-slate-900/40 hover:text-slate-600'
                                }`}
                              >
                                Medical
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
