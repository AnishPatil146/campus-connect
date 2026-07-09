'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@campus-connect/ui';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';
import { api, TimetableEntry } from '../../../../utils/api';

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('BSc IT');
  const [selectedDivision, setSelectedDivision] = useState('Division A');


  const loadTimetable = async () => {
    const list = await api.getTimetable();
    setTimetable(list);
  };

  useEffect(() => {
    loadTimetable();
  }, []);

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
      
      // Support matching variations like "Division A", "Div A"
      const cleanInputDiv = selectedDivision.replace(/div(ision)?/i, '').trim().toLowerCase();
      const cleanItemDiv = item.division.replace(/div(ision)?/i, '').trim().toLowerCase();
      
      const matchCourse = item.course.toLowerCase().trim() === selectedCourse.toLowerCase().trim();
      const matchDiv = cleanItemDiv === cleanInputDiv;

      return matchDay && matchCourse && matchDiv;
    });
  };

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
                      <div className="p-12 text-center border border-dashed border-slate-150 dark:border-slate-800 rounded-3xl bg-slate-50/20 dark:bg-slate-900/5">
                        <BookOpen className="h-8 w-8 text-slate-350 mx-auto mb-3" />
                        <p className="text-xs text-slate-450 font-bold">No lectures scheduled</p>
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
                                  <MapPin className="h-3.5 w-3.5 text-slate-450" /> {lecture.classroom}
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
