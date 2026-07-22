'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';
import { Clock, Calendar, BookOpen, User, Building2 } from 'lucide-react';

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTimetables({ collegeId: user?.collegeId });
      if (res.success && res.data) {
        setTimetable(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch timetable:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        fetchTimetable();
      };
      socket.on('TIMETABLE_UPDATED', handleUpdate);
      socket.on('timetable:published', handleUpdate);
      return () => {
        socket.off('TIMETABLE_UPDATED', handleUpdate);
        socket.off('timetable:published', handleUpdate);
      };
    }
  }, [socket]);

  return (
    <DashboardLayout title="Teacher Timetable & Class Schedule" icon={<Clock className="h-6 w-6 text-role-primary" />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-role-surface border border-role-border p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Weekly Lecture Schedule
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time schedule assigned to your department and courses across divisions.
            </p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 self-start sm:self-auto">
            Live Dynamic Schedule
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading schedule...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {daysOfWeek.map((day) => {
              const dayLectures = timetable.filter((t) => t.dayOfWeek?.toLowerCase() === day.toLowerCase());
              return (
                <Card key={day} className="border-role-border bg-role-card-bg">
                  <CardHeader className="pb-3 border-b border-role-border/50">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-role-primary" />
                        {day}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {dayLectures.length} {dayLectures.length === 1 ? 'Lecture' : 'Lectures'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {dayLectures.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 italic">
                        No scheduled lectures for {day}
                      </p>
                    ) : (
                      dayLectures.map((lec: any, idx: number) => (
                        <div
                          key={lec.id || idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                              {lec.subjectName || lec.subject?.name || 'Lecture'}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                              {lec.startTime || '09:00 AM'} - {lec.endTime || '10:00 AM'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              Room: {lec.roomNo || 'Room 301'}
                            </span>
                            <span className="font-semibold text-role-primary">
                              {lec.classroom || lec.divisionName || 'Division A'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
