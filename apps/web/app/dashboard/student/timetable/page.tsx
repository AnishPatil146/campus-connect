'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@campus-connect/ui';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';
import { api, TimetableEntry } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';

export default function TimetablePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('BSc IT');
  const [selectedDivision, setSelectedDivision] = useState('Division A');
  const [loading, setLoading] = useState(true);

  // Synchronize selections with logged-in user profile attributes
  useEffect(() => {
    const profile = (user as any)?.studentProfile;
    if (profile?.division) {
      const divName = profile.division.name;
      const courseName = profile.division.semester?.academicSession?.course?.name;
      if (divName) setSelectedDivision(divName);
      if (courseName) setSelectedCourse(courseName);
    }
  }, [user]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const list = await api.getTimetable(selectedCourse, selectedDivision);
      setTimetable(list);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCourse, selectedDivision]);

  useEffect(() => {
    if (!socket) return;
    const handleTimetableUpdate = () => {
      loadTimetable();
    };
    socket.on('TIMETABLE_UPDATED', handleTimetableUpdate);
    return () => {
      socket.off('TIMETABLE_UPDATED', handleTimetableUpdate);
    };
  }, [socket]);

  const days = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' }
  ];

  // Helper to map weekday names to our lowercase tabs
  const filterLecturesByDay = (dayValue: string) => {
    return timetable.filter((item) => {
      const matchDay = item.day.toLowerCase() === dayValue;
      
      const cleanInputDiv = selectedDivision.replace(/div(ision)?/i, '').trim().toLowerCase();
      const cleanItemDiv = item.division.replace(/div(ision)?/i, '').trim().toLowerCase();
      
      const matchCourse = item.course.toLowerCase().trim() === selectedCourse.toLowerCase().trim();
      const matchDiv = cleanItemDiv === cleanInputDiv;

      return matchDay && matchCourse && matchDiv;
    });
  };

  const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayValue = weekdayNames[new Date().getDay()];
  const todayLectures = filterLecturesByDay(todayValue);
  if (loading) {
    return (
      <DashboardLayout title="Student Timetable" icon={<Clock className="h-6 w-6" />}>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading class schedules...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Timetable" icon={<Clock className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col gap-1 text-left min-w-[140px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Course</span>
            <select
              className="h-10 px-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="BSc IT">BSc IT</option>
              <option value="BCom">BCom</option>
              <option value="BA">BA</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 text-left min-w-[140px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Division</span>
            <select
              className="h-10 px-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <option value="Division A">Division A</option>
              <option value="Division B">Division B</option>
            </select>
          </div>

          <div className="ml-auto text-right hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Session</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">Active (2026–27)</span>
          </div>
        </div>

        {/* Today's Classes */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">📅 Today's Classes</h3>
          {todayLectures.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-150 dark:border-slate-850 rounded-3xl bg-slate-50/10 dark:bg-slate-950/20">
              <BookOpen className="h-6 w-6 text-slate-350 mx-auto mb-2" />
              <p className="text-xs text-slate-550 font-bold">No classes scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayLectures.map((lecture, idx) => (
                <div 
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-100 dark:border-slate-905 bg-white dark:bg-slate-950 flex flex-col justify-between gap-3 shadow-sm hover:border-blue-200 dark:hover:border-slate-800 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-md">
                        {lecture.subjectCode || 'LEC'}
                      </span>
                      <h4 className="font-bold text-slate-805 dark:text-slate-200 text-xs mt-2.5">{lecture.subject}</h4>
                    </div>
                    <Badge variant="primary" className="text-[9px] px-2 py-0.5 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {lecture.timeSlot}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-450 border-t border-slate-50 dark:border-slate-900 pt-3">
                    <span className="flex items-center gap-1 font-semibold">
                      <User className="h-3.5 w-3.5" /> {lecture.teacher}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="h-3.5 w-3.5" /> {lecture.classroom}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly View Schedule Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-extrabold text-slate-850 dark:text-white">Weekly Class Schedule</CardTitle>
            <p className="text-xs text-slate-400">View and track your weekly lectures and classroom assignments for {selectedCourse} - {selectedDivision}</p>
          </CardHeader>
          <CardContent>
            
            <Tabs defaultValue="monday">
              <TabsList className="mb-6 flex overflow-x-auto pb-1 max-w-full">
                {days.map((day) => (
                  <TabsTrigger key={day.value} value={day.value} className="text-xs px-3">
                    {day.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {days.map((day) => {
                const dayLectures = filterLecturesByDay(day.value);
                return (
                  <TabsContent key={day.value} value={day.value} className="space-y-4">
                    {dayLectures.length === 0 ? (
                      <div className="p-12 text-center border border-dashed border-slate-150 dark:border-slate-850 rounded-3xl bg-slate-50/10 dark:bg-slate-950/20">
                        <BookOpen className="h-8 w-8 text-slate-350 mx-auto mb-3" />
                        <p className="text-xs text-slate-550 font-bold">No classes scheduled.</p>
                        <p className="text-[10px] text-slate-400 mt-1">There are no classes scheduled for {day.label} in {selectedCourse} {selectedDivision}.</p>
                      </div>
                    ) : (
                      dayLectures.map((lecture, idx) => (
                        <div 
                          key={idx} 
                          className="p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-blue-200 dark:hover:border-slate-800 shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {lecture.subjectCode || 'CS'}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">{lecture.subject}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-slate-450" /> {lecture.teacher}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-455" /> {lecture.classroom}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 md:self-center">
                            <Badge variant="primary" className="flex items-center gap-1 text-[10px] px-2.5 py-1">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              {lecture.timeSlot}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>

          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
