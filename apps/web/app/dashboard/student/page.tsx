'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../components/AuthProvider';
import { useStudentData } from '../../../components/StudentDataProvider';
import { useSocket } from '../../../components/SocketProvider';
import { api } from '../../../utils/api';
import Link from 'next/link';
import { 
  Award, 
  Calendar, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Megaphone, 
  ChevronRight, 
  ArrowUpRight,
  Star,
  Trophy,
  AlertTriangle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { notes, events, announcements } = useStudentData();
  const profileCompletion = (user as any)?.profileCompletionPercentage;

  // Dynamic welcome name
  const studentName = user?.name || 'Anish';

  const { socket } = useSocket();
  const [attendancePercent, setAttendancePercent] = React.useState<number>(87);
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getStudentDashboard();
      if (resp.success && resp.data) {
        setDashboardData(resp.data);
        if (resp.data.attendance) {
          setAttendancePercent(resp.data.attendance.overallPercentage);
        }
      } else {
        setError(resp.message || 'Failed to load student dashboard.');
      }
    } catch (err) {
      setError('A connection error occurred while retrieving student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboard();
  }, [user]);

  React.useEffect(() => {
    if (!socket) return;
    const handleAttendanceUpdate = (data: any) => {
      if (data && data.percentage !== undefined) {
        setAttendancePercent(data.percentage);
      }
    };
    socket.on('attendanceUpdate', handleAttendanceUpdate);
    return () => {
      socket.off('attendanceUpdate', handleAttendanceUpdate);
    };
  }, [socket]);

  // Find latest items from the state context
  const latestAnnouncement = announcements.find(a => !a.isRead) || announcements[0] || (dashboardData?.announcements?.[0] ? { title: dashboardData.announcements[0].title, date: 'Today', isRead: false } : null);
  const nextEvent = events.find(e => !e.isParticipating) || events[0] || (dashboardData?.events?.[0] ? { title: dashboardData.events[0].title, date: 'Upcoming', isParticipating: false } : null);
  const recentlyAddedNotes = notes.slice(0, 3);

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading student dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="p-6 bg-red-50/60 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-2xl text-center space-y-4 max-w-md mx-auto mt-12">
          <AlertTriangle className="h-10 w-10 text-red-550 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Failed to Load Dashboard</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const studentInfo = {
    studentId: dashboardData?.student?.admissionNo || 'STU-2026-089',
    department: dashboardData?.student?.course || 'Computer Science & Engineering',
    semester: dashboardData?.student?.semester || 'Semester 4',
    gpa: dashboardData?.performance?.gpa || 8.8,
    attendance: attendancePercent,
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        
        {/* Profile Completion Alert Banner */}
        {profileCompletion !== undefined && profileCompletion < 100 && (
          <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Complete your profile</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your profile is only <span className="font-semibold text-blue-600 dark:text-blue-450">{profileCompletion}% complete</span>. Fill in required details to access all features.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
              <div className="flex-1 sm:flex-initial w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <Link 
                href="/dashboard/student/profile" 
                className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-wider shrink-0"
              >
                Complete Profile →
              </Link>
            </div>
          </div>
        )}

        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-500/10">
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                Portal Home
              </span>
              <h2 className="text-2xl font-extrabold mt-3 tracking-tight">Good Morning, {studentName} 👋</h2>
              <p className="text-white/80 text-sm mt-1 max-w-md">
                Welcome back to your Campus Connect workspace. You have an upcoming lecture starting shortly.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/12 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 min-w-[90px]">
                <div className="text-2xl font-bold">{studentInfo.gpa}</div>
                <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">GPA</div>
              </div>
              <div className="bg-white/12 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 min-w-[90px]">
                <div className="text-2xl font-bold">{studentInfo.attendance}%</div>
                <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Attendance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Attendance */}
          <Link href="/dashboard/student/attendance" className="group">
            <Card className="h-full border-slate-100 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Attendance</span>
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{studentInfo.attendance}%</span>
                  <p className="text-[10px] text-slate-400 mt-1">Status: Safe (above 75%)</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Upcoming Class */}
          <Link href="/dashboard/student/timetable" className="group">
            <Card className="h-full border-slate-100 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Upcoming Class</span>
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate">
                    {dashboardData?.todayClasses?.[0]?.subjectName || 'None Scheduled'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {dashboardData?.todayClasses?.[0]
                      ? `Time: ${dashboardData.todayClasses[0].startTime} • Rm ${dashboardData.todayClasses[0].classroom}`
                      : 'Enjoy your day!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
 
           {/* Card 3: Next Event */}
           <Link href="/dashboard/student/events" className="group">
             <Card className="h-full border-slate-100 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5">
               <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Next Event</span>
                   <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                     <Star className="h-4 w-4" />
                   </div>
                 </div>
                 <div>
                   <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">{nextEvent?.title || 'Hackathon'}</span>
                   <p className="text-[10px] text-slate-400 mt-1">Date: {nextEvent?.date || 'Upcoming'}</p>
                 </div>
               </CardContent>
             </Card>
           </Link>
 
           {/* Card 4: Latest Announcement */}
           <Link href="/dashboard/student/announcements" className="group">
             <Card className="h-full border-slate-100 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5">
               <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Latest Info</span>
                   <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                     <Megaphone className="h-4 w-4" />
                   </div>
                 </div>
                 <div>
                   <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">{latestAnnouncement?.title || 'No Notice'}</span>
                   <p className="text-[10px] text-slate-400 mt-1">Published: {latestAnnouncement?.date || 'Today'}</p>
                 </div>
               </CardContent>
             </Card>
           </Link>
 
           {/* Card 5: Class Leaderboard Rank */}
           <Link href="/dashboard/student/performance" className="group">
             <Card className="h-full border-slate-100 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5">
               <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Leaderboard</span>
                   <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                     <Trophy className="h-4 w-4" />
                   </div>
                 </div>
                 <div>
                   <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Rank #{dashboardData?.leaderboard?.position || 'N/A'}</span>
                   <p className="text-[10px] text-slate-400 mt-1">
                     Percentile: Top {Math.round(((dashboardData?.leaderboard?.position || 1) / (dashboardData?.performance?.totalStudents || 120)) * 100) || 5}%
                   </p>
                 </div>
               </CardContent>
             </Card>
           </Link>

        </div>

        {/* Two-Column Section: Left side (Notes & Timetable), Right side (Quick Actions & Event summaries) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Recently Added Notes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recently Added Notes Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>Recently Added Notes</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">Newly uploaded resource study hubs for your courses</p>
                </div>
                <Link href="/dashboard/student/notes" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentlyAddedNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="p-4 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between gap-4 hover:bg-white dark:hover:bg-slate-950 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-xs md:max-w-md">{note.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {note.subject} • Semester {note.semester} • By {note.teacher}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" className="text-[8px] bg-blue-50 text-blue-600">
                        New
                      </Badge>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {note.uploadDate}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick overview of Today's Timetable */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>Today's Schedule</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">Your upcoming lectures for today</p>
                </div>
                <Link href="/dashboard/student/timetable" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Full Timetable <ChevronRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {(!dashboardData?.todayClasses || dashboardData.todayClasses.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-slate-150 dark:border-slate-850 rounded-2xl bg-slate-50/10 dark:bg-slate-955/10">
                    <BookOpen className="h-6 w-6 text-slate-350 mx-auto mb-2" />
                    <p className="text-xs text-slate-550 font-bold">No classes scheduled for today.</p>
                  </div>
                ) : (
                  dashboardData.todayClasses.map((lecture: any, idx: number) => (
                    <div 
                      key={lecture.id || idx}
                      className="p-4 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-white dark:hover:bg-slate-950 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {lecture.subjectName?.substring(0, 4).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{lecture.subjectName}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">Instructor: {lecture.teacher}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                          {lecture.startTime} - {lecture.endTime}
                        </span>
                        <span className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg font-bold">
                          {lecture.classroom}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
 
           </div>
 
           {/* Column 3: Quick Actions & Registry Info */}
           <div className="space-y-6">
             
             {/* Quick Actions Card */}
             <Card>
               <CardHeader>
                 <CardTitle>⚡ Quick Actions</CardTitle>
                 <p className="text-xs text-slate-550">Frequently used student shortcuts</p>
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-3">
                 <Link href="/dashboard/student/timetable">
                   <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-850 hover:shadow-md hover:shadow-blue-500/5 active:bg-gradient-to-r active:from-blue-600 active:to-blue-500 active:text-white transition-all font-medium text-slate-700 dark:text-slate-300 text-xs cursor-pointer">
                     <span>View Timetable</span>
                     <ArrowUpRight className="h-4 w-4 text-slate-400" />
                   </button>
                 </Link>
 
                 <Link href="/dashboard/student/attendance">
                   <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-850 hover:shadow-md hover:shadow-blue-500/5 active:bg-gradient-to-r active:from-blue-600 active:to-blue-500 active:text-white transition-all font-medium text-slate-700 dark:text-slate-300 text-xs cursor-pointer">
                     <span>View Attendance</span>
                     <ArrowUpRight className="h-4 w-4 text-slate-400" />
                   </button>
                 </Link>
 
                 <Link href="/dashboard/student/events">
                   <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-850 hover:shadow-md hover:shadow-blue-500/5 active:bg-gradient-to-r active:from-blue-600 active:to-blue-500 active:text-white transition-all font-medium text-slate-700 dark:text-slate-300 text-xs cursor-pointer">
                     <span>Explore Events</span>
                     <ArrowUpRight className="h-4 w-4 text-slate-400" />
                   </button>
                 </Link>
 
                 <Link href="/dashboard/student/notes">
                   <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-850 hover:shadow-md hover:shadow-blue-500/5 active:bg-gradient-to-r active:from-blue-600 active:to-blue-500 active:text-white transition-all font-medium text-slate-700 dark:text-slate-300 text-xs cursor-pointer">
                     <span>Browse Study Notes</span>
                     <ArrowUpRight className="h-4 w-4 text-slate-400" />
                   </button>
                 </Link>
               </CardContent>
             </Card>
 
             {/* Registry Card */}
             <Card>
               <CardContent className="p-5 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-blue-600 dark:text-blue-400">
                     <Award className="h-5 w-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Academic Profile</h3>
                     <p className="text-[10px] text-slate-400 mt-0.5">ID: {studentInfo.studentId}</p>
                   </div>
                 </div>
                 
                 <div className="border-t border-slate-50 dark:border-slate-900" />
 
                 <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-50/50 dark:border-slate-850 animate-fade-in">
                     <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Course</span>
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-0.5 truncate">{studentInfo.department}</span>
                   </div>
                   <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-50/50 dark:border-slate-850 animate-fade-in">
                     <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Semester</span>
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-0.5">{studentInfo.semester}</span>
                   </div>
                 </div>
               </CardContent>
             </Card>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
