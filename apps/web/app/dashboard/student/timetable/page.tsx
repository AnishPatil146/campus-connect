'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@campus-connect/ui';
import { Clock, MapPin, User } from 'lucide-react';

interface Lecture {
  code: string;
  name: string;
  time: string;
  room: string;
  instructor: string;
}

export default function TimetablePage() {
  const weeklySchedule: Record<string, Lecture[]> = {
    monday: [
      { code: 'CS-401', name: 'Database Management System', time: '09:00 AM - 10:30 AM', room: 'LHC-302', instructor: 'Dr. Sarah Jenkins' },
      { code: 'CS-403', name: 'Python Programming', time: '11:00 AM - 12:30 PM', room: 'LHC-101', instructor: 'Prof. Amit Patil' },
      { code: 'MATH-405', name: 'Discrete Mathematics', time: '02:00 PM - 03:30 PM', room: 'Seminar Hall B', instructor: 'Dr. John Nash' }
    ],
    tuesday: [
      { code: 'CS-402', name: 'Operating System Basics', time: '09:00 AM - 10:30 AM', room: 'LHC-302', instructor: 'Prof. Alan Turing' },
      { code: 'CS-404', name: 'Java Programming Language', time: '11:00 AM - 12:30 PM', room: 'LHC-204', instructor: 'Prof. James Gosling' }
    ],
    wednesday: [
      { code: 'CS-401', name: 'Database Management System', time: '10:00 AM - 11:30 AM', room: 'LHC-302', instructor: 'Dr. Sarah Jenkins' },
      { code: 'CS-402', name: 'Operating System Basics', time: '12:00 PM - 01:30 PM', room: 'LHC-101', instructor: 'Prof. Alan Turing' },
      { code: 'CS-403', name: 'Python Programming (Lab)', time: '02:30 PM - 04:30 PM', room: 'Computer Lab 3', instructor: 'Prof. Amit Patil' }
    ],
    thursday: [
      { code: 'CS-404', name: 'Java Programming Language', time: '09:00 AM - 10:30 AM', room: 'LHC-204', instructor: 'Prof. James Gosling' },
      { code: 'MATH-405', name: 'Discrete Mathematics', time: '11:00 AM - 12:30 PM', room: 'Seminar Hall B', instructor: 'Dr. John Nash' }
    ],
    friday: [
      { code: 'CS-401', name: 'DBMS Practice Session', time: '09:00 AM - 10:30 AM', room: 'Computer Lab 1', instructor: 'Dr. Sarah Jenkins' },
      { code: 'CS-402', name: 'Operating System (Lab)', time: '11:00 AM - 01:00 PM', room: 'Computer Lab 2', instructor: 'Prof. Alan Turing' }
    ],
    saturday: [
      { code: 'SEM-CS', name: 'Guest Lecture: AI & Large Language Models', time: '10:00 AM - 12:30 PM', room: 'Main Auditorium', instructor: 'Industry Expert' }
    ]
  };

  const days = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' }
  ];

  return (
    <DashboardLayout title="📖 Student Timetable">
      <div className="space-y-6">
        
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <p className="text-xs text-slate-500">View and track your weekly lectures, lab assignments, and classrooms</p>
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

              {days.map((day) => (
                <TabsContent key={day.value} value={day.value} className="space-y-4">
                  {weeklySchedule[day.value]?.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5">
                      <p className="text-xs text-slate-450 font-medium">No classes scheduled for this day</p>
                    </div>
                  ) : (
                    weeklySchedule[day.value].map((lecture, idx) => (
                      <div 
                        key={idx} 
                        className="p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-blue-200 shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {lecture.code}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">{lecture.name}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] text-slate-450 font-medium">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {lecture.instructor}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {lecture.room}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 md:self-center">
                          <Badge variant="primary" className="flex items-center gap-1 text-[10px] px-2.5 py-1">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {lecture.time}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              ))}

            </Tabs>

          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
