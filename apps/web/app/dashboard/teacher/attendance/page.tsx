'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { Clock, BookOpen, AlertCircle, Save, RotateCcw, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';

interface StudentAttendanceState {
  id: string; // studentId
  name: string;
  prn: string; // rollNumber
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL';
  recordId?: string; // if editing existing record
}

interface ClassSession {
  id: string; // timetable slot ID
  subjectId: string;
  divisionId: string;
  semesterId: string;
  slotNumber: number;
  subjectName: string;
  classroom: string;
  division: string;
  startTime: string;
  endTime: string;
  pending: boolean;
  sessionId?: string; // if session is already created
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Today's classes state
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isClassesLoading, setIsClassesLoading] = useState(true);

  // Selected class for taking attendance
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);

  // Student list for marking attendance
  const [students, setStudents] = useState<StudentAttendanceState[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // Original state for resetting
  const [originalStudents, setOriginalStudents] = useState<StudentAttendanceState[]>([]);

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Statistics
  const totalClasses = classes.length;
  const pendingAttendanceCount = classes.filter(c => c.pending).length;
  const totalStudentsTaught = 42; // Division A size

  // Keep ticking counter updated
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch classes and check their attendance status
  const fetchClassesSchedule = async () => {
    if (!user?.teacherProfile?.id) return;
    setIsClassesLoading(true);
    const res = await api.getTeacherDashboard();
    
    if (res.success && res.data) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      
      // Fetch today's created attendance sessions for this teacher
      const sessionsRes = await api.getAttendanceSessions({
        teacherId: user.teacherProfile.id,
        date: todayDateStr,
      });

      const todaySessions = sessionsRes.success ? sessionsRes.data : [];

      const mappedClasses = (res.data.todayClasses || []).map((cls: any) => {
        // Find if session is already created for this slot
        const existingSession = todaySessions.find(
          (s: any) => 
            s.subjectId === cls.subjectId && 
            s.divisionId === cls.divisionId && 
            s.lectureNumber === cls.slotNumber
        );

        return {
          id: cls.id,
          subjectId: cls.subjectId,
          divisionId: cls.divisionId,
          semesterId: cls.semesterId,
          slotNumber: cls.slotNumber,
          subjectName: cls.subjectName,
          classroom: cls.classroom,
          division: cls.division,
          startTime: cls.startTime,
          endTime: cls.endTime,
          pending: !existingSession || existingSession.status === 'DRAFT',
          sessionId: existingSession?.id,
        };
      });

      setClasses(mappedClasses);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    }
    setIsClassesLoading(false);
  };

  // Load schedule on mount or user load
  useEffect(() => {
    if (user) {
      fetchClassesSchedule();
    }
  }, [user]);

  // Real-time listener for socket events to update schedule
  useEffect(() => {
    if (socket) {
      const handleTimetableUpdate = () => {
        fetchClassesSchedule();
      };
      socket.on('TIMETABLE_UPDATED', handleTimetableUpdate);
      return () => {
        socket.off('TIMETABLE_UPDATED', handleTimetableUpdate);
      };
    }
  }, [socket]);

  // Select class and load roster
  const handleSelectClass = async (cls: ClassSession) => {
    setSelectedClass(cls);
    setIsStudentsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // 1. Fetch Students in division
    const studentsRes = await api.getStudents({ divisionId: cls.divisionId });
    const divisionStudents = studentsRes.success ? studentsRes.data : [];

    // 2. Fetch attendance if session already exists
    if (cls.sessionId) {
      const attendanceRes = await api.getClassAttendance(cls.sessionId);
      const savedRecords = attendanceRes.success ? attendanceRes.data : [];

      const initialStudents: StudentAttendanceState[] = divisionStudents.map((std: any) => {
        const record = savedRecords.find((r: any) => r.studentId === std.id);
        return {
          id: std.id,
          name: std.profile ? `${std.profile.firstName} ${std.profile.lastName}` : std.name || 'Student',
          prn: std.rollNumber,
          status: record ? record.status : 'PRESENT',
          recordId: record?.id,
        };
      });

      setStudents(initialStudents);
      setOriginalStudents(JSON.parse(JSON.stringify(initialStudents)));
    } else {
      // Initialize all to PRESENT if session doesn't exist
      const initialStudents: StudentAttendanceState[] = divisionStudents.map((std: any) => ({
        id: std.id,
        name: std.profile ? `${std.profile.firstName} ${std.profile.lastName}` : std.name || 'Student',
        prn: std.rollNumber,
        status: 'PRESENT',
      }));

      setStudents(initialStudents);
      setOriginalStudents(JSON.parse(JSON.stringify(initialStudents)));
    }
    setIsStudentsLoading(false);
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
    if (!selectedClass || !user?.teacherProfile?.id) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let activeSessionId = selectedClass.sessionId;
      const todayDateStr = new Date().toISOString().split('T')[0];

      // 1. Create session if it doesn't exist
      if (!activeSessionId) {
        // Fallback to subjects taught to find academicSessionId or use default placeholder
        const academicSessionId = user.teacherProfile.subjects?.[0]?.academicSessionId || 'academic-session-placeholder';
        
        const sessionRes = await api.createAttendanceSession({
          collegeId: user.collegeId,
          academicSessionId,
          subjectId: selectedClass.subjectId,
          teacherId: user.teacherProfile.id,
          semesterId: selectedClass.semesterId,
          divisionId: selectedClass.divisionId,
          lectureNumber: selectedClass.slotNumber,
          attendanceDate: todayDateStr,
        });

        if (sessionRes.success && sessionRes.data) {
          activeSessionId = sessionRes.data.id;
        } else {
          throw new Error('Failed to create attendance session on server.');
        }
      }

      // 2. Submit/Mark attendance records
      const formattedRecords = students.map(s => ({
        studentId: s.id,
        status: s.status,
      }));

      const markRes = await api.markAttendance({
        attendanceSessionId: activeSessionId!,
        records: formattedRecords,
      });

      if (markRes.success) {
        setSuccessMsg(`Successfully saved attendance logs for ${selectedClass.subjectName}!`);
        
        // Trigger socket real-time update
        if (socket) {
          socket.emit('attendanceMarked', {
            classId: selectedClass.id,
            sessionId: activeSessionId,
            records: formattedRecords,
          });
        }

        setTimeout(() => {
          setSelectedClass(null);
          fetchClassesSchedule();
        }, 1500);
      } else {
        setErrorMsg('Failed to save attendance records.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'An error occurred while saving attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Attendance Work Center" icon={<BookOpen className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {/* Real-time Indicator Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/5 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
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
            Faculty Mode Active
          </div>
        </div>

        {/* TOP SECTION: Today's Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
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

          <Card className="border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
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

          <Card className="border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
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
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Today's Class Schedule
              </h3>
            </div>
            
            {isClassesLoading ? (
              <div className="text-center py-12">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading classes...</p>
              </div>
            ) : classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm hover:-translate-y-0.5 transition-all duration-205">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {cls.subjectName}
                          </h4>
                          <Badge variant={cls.pending ? 'warning' : 'success'} className="text-[9px]">
                            {cls.pending ? 'Pending' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Division {cls.division} • Room {cls.classroom}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-2">
                          <Clock className="h-3 w-3 text-emerald-500" /> {cls.startTime} - {cls.endTime}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleSelectClass(cls)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl active:scale-[0.98] transition-all shadow-sm ${
                          cls.pending
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                            : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        {cls.pending ? 'Take Attendance' : 'Review / Edit'}
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900/5 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-250 dark:border-slate-800 text-center">
                <AlertCircle className="h-8 w-8 text-slate-450" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mt-3">
                  No classes assigned.
                </h4>
                <p className="text-[10px] text-slate-450 mt-1">
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
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors animate-fade-in"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Schedule
              </button>

              <div className="flex flex-wrap items-center gap-2 self-end">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-xl text-xs font-bold hover:bg-emerald-100 active:scale-[0.98] transition-all dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
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
                  className="inline-flex items-center gap-1.5 px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-750 disabled:bg-slate-350 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  {loading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Card className="border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Marking Attendance: {selectedClass.subjectName}
                  </CardTitle>
                  <p className="text-[10px] text-slate-450">
                    Division {selectedClass.division} • Room {selectedClass.classroom}
                  </p>
                </div>
                <Badge variant="primary" className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {students.length} Enrolled Students
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {isStudentsLoading ? (
                  <div className="text-center py-12">
                    <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading roster...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-900 rounded-xl m-4 bg-slate-50/20 dark:bg-slate-900/5">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold">No attendance records.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                          <th className="py-3 px-6">Student Name</th>
                          <th className="py-3 px-6">Roll Number</th>
                          <th className="py-3 px-6 text-center">Status Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                        {students.map((std) => (
                          <tr key={std.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="py-3.5 px-6 font-bold text-slate-805 dark:text-slate-200 text-xs">
                              {std.name}
                            </td>
                            <td className="py-3.5 px-6 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {std.prn}
                            </td>
                            <td className="py-3.5 px-6">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* PRESENT Button */}
                                <button
                                  onClick={() => handleStatusChange(std.id, 'PRESENT')}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    std.status === 'PRESENT'
                                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      : 'bg-slate-50 text-slate-450 border border-transparent dark:bg-slate-900/30 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                                >
                                  Present
                                </button>

                                {/* ABSENT Button */}
                                <button
                                  onClick={() => handleStatusChange(std.id, 'ABSENT')}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    std.status === 'ABSENT'
                                      ? 'bg-red-500/10 text-red-600 border border-red-500/25 dark:bg-red-950/30 dark:text-red-400'
                                      : 'bg-slate-50 text-slate-450 border border-transparent dark:bg-slate-900/30 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                                >
                                  Absent
                                </button>

                                {/* LATE Button */}
                                <button
                                  onClick={() => handleStatusChange(std.id, 'LATE')}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    std.status === 'LATE'
                                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-400'
                                      : 'bg-slate-50 text-slate-450 border border-transparent dark:bg-slate-900/30 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                                >
                                  Late
                                </button>

                                {/* MEDICAL LEAVE Button */}
                                <button
                                  onClick={() => handleStatusChange(std.id, 'MEDICAL')}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    std.status === 'MEDICAL'
                                      ? 'bg-purple-500/10 text-purple-600 border border-purple-500/25 dark:bg-purple-950/30 dark:text-purple-400'
                                      : 'bg-slate-50 text-slate-450 border border-transparent dark:bg-slate-900/30 hover:text-slate-700 dark:hover:text-slate-200'
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
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
