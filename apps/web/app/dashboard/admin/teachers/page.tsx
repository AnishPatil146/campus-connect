'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Input, Badge } from '@campus-connect/ui';
import { Search, Plus, UserX, UserCheck, Award } from 'lucide-react';

interface Teacher {
  empId: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  status: 'ACTIVE' | 'SUSPENDED';
}

export default function TeacherManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [teachers, setTeachers] = useState<Teacher[]>([
    { empId: 'T-2024-001', name: 'Dr. Sarah Jenkins', email: 'teacher@college.edu', department: 'Computer Science', subjects: ['Operating Systems', 'System Programming'], status: 'ACTIVE' },
    { empId: 'T-2024-002', name: 'Prof. Amit Patil', email: 'amit.patil@college.edu', department: 'Computer Science', subjects: ['DBMS', 'Python Web Lab'], status: 'ACTIVE' },
    { empId: 'T-2024-003', name: 'Dr. John Doe', email: 'john.doe@college.edu', department: 'Information Technology', subjects: ['Data Structures', 'C++'], status: 'SUSPENDED' },
  ]);

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStatus = (empId: string) => {
    setTeachers(teachers.map(t => 
      t.empId === empId 
        ? { ...t, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } 
        : t
    ));
  };

  return (
    <DashboardLayout title="Teacher Management" icon={<UsersIcon />}>
      <div className="space-y-6">
        
        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Faculty</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">{teachers.length}</span>
              </div>
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Faculty</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1 block">
                  {teachers.filter(t => t.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Suspended</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                  {teachers.filter(t => t.status === 'SUSPENDED').length}
                </span>
              </div>
              <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter controls */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search faculty by name, ID or department..."
              className="pl-9 h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New Teacher</span>
          </Button>
        </Card>

        {/* Teachers list table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Subjects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((t) => (
                <TableRow key={t.empId}>
                  <TableCell className="font-semibold text-xs text-slate-555 dark:text-slate-400">{t.empId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((sub, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'danger'} className="text-[10px]">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="secondary" size="sm" className="h-8 text-xs font-medium px-2 rounded-lg" title="Edit Profile">
                      Edit
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => toggleStatus(t.empId)} 
                      className={`h-8 text-xs font-medium px-2 rounded-lg ${t.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                    >
                      {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>
    </DashboardLayout>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
