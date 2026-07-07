'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Plus, Layers } from 'lucide-react';

export default function AcademicManagement() {
  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'subjects' | 'sessions'>('departments');

  // Seeded mock data matching backend relations
  const departments = [
    { id: '1', name: 'Computer Science', coursesCount: 2, teachersCount: 8 },
    { id: '2', name: 'Information Technology', coursesCount: 1, teachersCount: 6 },
    { id: '3', name: 'Management Studies', coursesCount: 3, teachersCount: 5 },
  ];

  const courses = [
    { id: '1', name: 'BSc IT', code: 'BSC_IT', department: 'Computer Science', credits: 120 },
    { id: '2', name: 'BCom', code: 'BCOM', department: 'Management Studies', credits: 110 },
    { id: '3', name: 'BA', code: 'BA', department: 'Management Studies', credits: 90 },
  ];

  const subjects = [
    { id: '1', name: 'Database Management Systems', code: 'IT-301', course: 'BSc IT', semester: 'Semester 3', credits: 4, teacher: 'Prof. Amit Patil' },
    { id: '2', name: 'Operating Systems', code: 'IT-302', course: 'BSc IT', semester: 'Semester 3', credits: 4, teacher: 'Dr. Sarah Jenkins' },
    { id: '3', name: 'Financial Accounting', code: 'COM-101', course: 'BCom', semester: 'Semester 1', credits: 3, teacher: 'TBD' },
  ];

  const sessions = [
    { id: '1', name: '2026–27', semester: 'Semester 1 & 2', status: 'ACTIVE' },
    { id: '2', name: '2027–28', semester: 'Planning', status: 'DRAFT' },
  ];

  return (
    <DashboardLayout title="Academic Management" icon={<Layers className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'departments' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'courses' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'subjects' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Subjects
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'sessions' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Sessions & Classes
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Academic Departments</h3>
              <Button size="sm" className="rounded-lg h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                <Plus className="h-4 w-4 mr-1.5" /> Add Department
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Courses Offered</TableHead>
                    <TableHead>Faculty Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{dept.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{dept.coursesCount} Programs</TableCell>
                      <TableCell className="text-xs text-slate-500">{dept.teachersCount} Teachers</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Courses & Programs</h3>
              <Button size="sm" className="rounded-lg h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                <Plus className="h-4 w-4 mr-1.5" /> Add Course
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Min. Credits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-500">{c.code}</TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{c.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{c.department}</TableCell>
                      <TableCell className="text-xs text-slate-500">{c.credits} Credits</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Subjects Registry</h3>
              <Button size="sm" className="rounded-lg h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                <Plus className="h-4 w-4 mr-1.5" /> Add Subject
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Course & Term</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Assigned Faculty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-500">{sub.code}</TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{sub.course} • {sub.semester}</TableCell>
                      <TableCell className="text-xs font-semibold">{sub.credits} HP</TableCell>
                      <TableCell className="text-xs text-slate-500">{sub.teacher}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Academic Sessions & Divisions</h3>
              <Button size="sm" className="rounded-lg h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                <Plus className="h-4 w-4 mr-1.5" /> Add Session
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semesters Covered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{s.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{s.semester}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
