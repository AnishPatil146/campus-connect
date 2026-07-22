'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { User as UserIcon, Mail, Building2, BookOpen, Shield, Phone, Calendar } from 'lucide-react';

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const profile = user?.teacherProfile;

  return (
    <DashboardLayout title="Faculty Member Profile" icon={<UserIcon className="h-6 w-6 text-role-primary" />}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-role-border bg-role-card-bg overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-role-primary/30 via-purple-500/20 to-blue-500/30" />
          <CardContent className="px-6 pb-6 relative pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 mb-6">
              <div className="h-24 w-24 rounded-2xl bg-role-surface border-4 border-role-card-bg shadow-xl flex items-center justify-center font-bold text-3xl text-role-primary">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{user?.name}</h1>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-role-primary" />
                  {user?.email}
                </p>
              </div>
              <Badge className="sm:ml-auto bg-role-primary/10 text-role-primary border-role-primary/30">
                Faculty Member ({profile?.employeeId || 'FAC-101'})
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Department & Designation</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-role-primary" />
                  {profile?.department?.name || 'Computer Science & Engineering'}
                </p>
                <p className="text-xs text-slate-500 font-medium">Designation: {profile?.designation || 'Assistant Professor'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">College Group & Status</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Balasaheb Mhatre Group Faculty
                </p>
                <p className="text-xs text-slate-500 font-medium">Status: Active Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
