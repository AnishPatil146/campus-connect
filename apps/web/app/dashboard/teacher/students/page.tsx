'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { api } from '../../../../utils/api';
import { Users, Search, GraduationCap, Mail } from 'lucide-react';

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStudents({ collegeId: user?.collegeId });
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch students:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleStudentCreated = () => {
      fetchStudents();
    };
    socket.on('student:created', handleStudentCreated);
    socket.on('student.created', handleStudentCreated);
    return () => {
      socket.off('student:created', handleStudentCreated);
      socket.off('student.created', handleStudentCreated);
    };
  }, [socket]);

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentProfile?.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Student Roster & Directory" icon={<Users className="h-6 w-6 text-role-primary" />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-role-surface border border-role-border p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Assigned Students Directory
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              View and manage active students enrolled in your course divisions.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-role-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading student roster...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-role-surface border border-role-border rounded-2xl">
            No students found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((st) => (
              <Card key={st.id} className="border-role-border bg-role-card-bg hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-role-primary/10 text-role-primary flex items-center justify-center font-bold text-sm">
                        {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{st.name}</h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {st.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {st.status || 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5 text-role-primary" />
                      Roll: <strong className="text-slate-900 dark:text-white">{st.studentProfile?.rollNumber || 'STU-001'}</strong>
                    </span>
                    <span>
                      {st.studentProfile?.division?.name || 'Division A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
