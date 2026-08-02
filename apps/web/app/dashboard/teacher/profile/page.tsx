'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { User as UserIcon, Mail, Building2, Shield } from 'lucide-react';

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const profile = user?.teacherProfile as any;
  const subjectsTaught = profile?.subjects || [];
  const isHod = profile?.isHod || profile?.designation?.toLowerCase().includes('head') || false;

  return (
    <DashboardLayout title="Faculty Member Profile" icon={<UserIcon className="h-6 w-6 text-role-primary" />}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-role-border bg-role-card-bg overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-emerald-600/30 via-teal-500/20 to-blue-500/30" />
          <CardContent className="px-6 pb-6 relative pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 mb-6">
              <div className="h-24 w-24 rounded-2xl bg-role-surface border-4 border-role-card-bg shadow-xl flex items-center justify-center font-bold text-3xl text-emerald-600">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{user?.name}</h1>
                  {isHod && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold text-[10px]">
                      HOD (Head of Dept)
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  {user?.email} • {profile?.phone || user?.phone || 'Phone: Registered'}
                </p>
              </div>
              <Badge className="sm:ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {profile?.designation || profile?.teacher?.designation || 'Faculty Member'}
              </Badge>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
              
              {/* Personal Info & Contact */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Personal Information</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">Email: {user?.email}</p>
                <p className="text-xs text-slate-500">Phone: {profile?.phone || user?.phone || 'N/A'}</p>
              </div>

              {/* Department & Designation */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Department & Designation</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  {profile?.department?.name || profile?.teacher?.department?.name || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 font-medium">Designation: {profile?.designation || profile?.teacher?.designation || 'Faculty Member'}</p>
              </div>

              {/* Qualifications */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Qualifications & Academic Degrees</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile?.qualifications?.[0]?.degree || profile?.qualification || 'N/A'}
                </p>
                <p className="text-xs text-slate-500">
                  {profile?.teacher?.joiningDate ? `Experience: ${Math.max(1, new Date().getFullYear() - new Date(profile.teacher.joiningDate).getFullYear())} Years` : 'Experience: N/A'}
                </p>
              </div>

              {/* HOD Status */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">HOD Status & Administrative Role</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  {isHod ? 'Head of Department (HOD)' : 'Faculty Member / Course Instructor'}
                </p>
                <p className="text-xs text-slate-500">Role: {isHod ? 'Department Administrative & Academic Head' : 'Class Instructor'}</p>
              </div>

              {/* Assigned Classes */}
              <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Assigned Classes & Roster Courses</span>
                {subjectsTaught.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium">No assigned classes listed in database roster</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subjectsTaught.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.subject?.name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                          {item.division?.name || 'Division A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
