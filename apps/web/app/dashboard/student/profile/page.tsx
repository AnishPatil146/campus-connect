'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { Mail, Calendar, School, GraduationCap } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const profileDetails = {
    name: user?.name || 'Anish Kumar',
    studentId: 'STU-2026-089',
    department: 'Computer Science & Engineering',
    email: user?.email || 'anish.kumar@campusconnect.edu',
    dob: 'August 14, 2005',
    college: "Pushpalata Women's College",
    division: 'Division A',
    semester: 'Semester 4'
  };

  return (
    <DashboardLayout title="👤 Student Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Profile Card Header */}
        <Card className="overflow-hidden border-slate-100 bg-white dark:bg-slate-950">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
              {profileDetails.name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{profileDetails.name}</h2>
              <p className="text-xs text-slate-450 mt-1 font-semibold">ID: {profileDetails.studentId}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                <span className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-650 dark:text-slate-400 font-bold px-2.5 py-1 rounded-lg">
                  {profileDetails.semester}
                </span>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/20 border border-blue-100/10 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-lg">
                  {profileDetails.division}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Grid */}
        <Card className="border-slate-100 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Academic Registry Profile</CardTitle>
            <p className="text-xs text-slate-500">Official student details from college databases</p>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileDetails.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileDetails.dob}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                <School className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Affiliated College</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileDetails.college}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                <GraduationCap className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Department / Branch</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileDetails.department}</span>
                </div>
              </div>

            </div>

          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
