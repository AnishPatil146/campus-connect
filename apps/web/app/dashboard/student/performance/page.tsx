'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@campus-connect/ui';
import { Award, BookOpen, TrendingUp } from 'lucide-react';

export default function PerformancePage() {
  const academicProgress = {
    course: 'Bachelor of Science in Information Technology (BSc IT)',
    semester: 'Semester 4',
    division: 'Division A',
    gpa: '3.82',
    rank: '3'
  };

  const subjects = [
    { name: 'Database Management System', code: 'CS-401', faculty: 'Dr. Sarah Jenkins', credits: 4, marks: '88%' },
    { name: 'Operating System', code: 'CS-402', faculty: 'Prof. Alan Turing', credits: 4, marks: '90%' },
    { name: 'Python Programming', code: 'CS-403', faculty: 'Prof. Amit Patil', credits: 3, marks: '92%' },
    { name: 'Java Programming', code: 'CS-404', faculty: 'Prof. James Gosling', credits: 4, marks: '85%' },
    { name: 'Discrete Mathematics', code: 'MATH-405', faculty: 'Dr. John Nash', credits: 3, marks: '82%' }
  ];

  const leaderboard = [
    { rank: '🥇 1', name: 'Rahul Sharma', score: '92.4%', isCurrentUser: false },
    { rank: '🥈 2', name: 'Sneha Patel', score: '90.2%', isCurrentUser: false },
    { rank: '🥉 3', name: 'Anish Kumar (You)', score: '89.0%', isCurrentUser: true },
    { rank: '4', name: 'Aniket Gupta', score: '85.6%', isCurrentUser: false },
    { rank: '5', name: 'Rohan Mehra', score: '81.3%', isCurrentUser: false }
  ];

  const semesterGrades = [
    { sem: 'Sem 1', gpa: 3.65 },
    { sem: 'Sem 2', gpa: 3.74 },
    { sem: 'Sem 3', gpa: 3.82 },
    { sem: 'Sem 4', gpa: 3.90 }
  ];

  return (
    <DashboardLayout title="Academic Performance">
      <div className="space-y-6">
        
        {/* Header Academic Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Course Enrollment</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{academicProgress.course}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {academicProgress.semester} • {academicProgress.division}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/30 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Current Rank</span>
                  <span className="text-lg font-bold text-slate-850 dark:text-slate-100 block mt-0.5">Rank #{academicProgress.rank}</span>
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                Top 5%
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Subjects Marks & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Subjects Table (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Progress</CardTitle>
                <p className="text-xs text-slate-500">Subject-wise marks distribution, credits, and faculty members</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Subject Title</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((sub) => (
                      <TableRow key={sub.code}>
                        <TableCell className="font-semibold text-xs text-slate-500 dark:text-slate-400">{sub.code}</TableCell>
                        <TableCell className="font-medium text-xs text-slate-800 dark:text-slate-200">{sub.name}</TableCell>
                        <TableCell className="text-xs text-slate-650 dark:text-slate-350">{sub.faculty}</TableCell>
                        <TableCell className="text-center text-xs text-slate-600 dark:text-slate-400">{sub.credits}</TableCell>
                        <TableCell className="text-right font-bold text-xs text-blue-600 dark:text-blue-400">{sub.marks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* GPA progression graph */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>GPA Progression</CardTitle>
                  <p className="text-xs text-slate-500">Academic improvement trends over semesters</p>
                </div>
                <Badge variant="primary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Average: {academicProgress.gpa}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full flex flex-col justify-end pt-6">
                  <div className="flex-1 w-full relative flex items-end justify-between border-b border-l border-slate-100 dark:border-slate-800 px-6 pb-2">
                    
                    {/* SVG Line Graph */}
                    <svg className="absolute inset-0 h-[80%] w-full px-12" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M 0 75 L 33 55 L 66 35 L 100 15"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 0 75 L 33 55 L 66 35 L 100 15 L 100 100 L 0 100 Z"
                        fill="url(#grad-prog)"
                        opacity="0.1"
                      />
                      <defs>
                        <linearGradient id="grad-prog" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {semesterGrades.map((grade, idx) => (
                      <div key={idx} className="flex flex-col items-center z-10 w-1/4">
                        <div className="bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow mb-1">
                          {grade.gpa.toFixed(2)}
                        </div>
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2.5 uppercase tracking-wider">{grade.sem}</span>
                      </div>
                    ))}

                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Section (Right column) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>🏆 Class Leaderboard</CardTitle>
                  <p className="text-xs text-slate-500">Student rankings based on latest term assessment</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((student) => (
                      <TableRow 
                        key={student.name}
                        className={student.isCurrentUser ? 'bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-50/90 dark:hover:bg-blue-950/30' : ''}
                      >
                        <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200">{student.rank}</TableCell>
                        <TableCell className={`text-xs ${student.isCurrentUser ? 'font-bold text-blue-700 dark:text-blue-400' : 'font-medium text-slate-650 dark:text-slate-300'}`}>
                          {student.name}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-bold ${student.isCurrentUser ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {student.score}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
