'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { getCollegeName } from '@campus-connect/utils';
import { User as UserIcon, Mail, Shield, Building2 } from 'lucide-react';

export default function AdminProfilePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="System Administrator Profile" icon={<UserIcon className="h-6 w-6 text-role-primary" />}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-role-border bg-role-card-bg overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-blue-600/30 via-indigo-500/20 to-purple-600/30" />
          <CardContent className="px-6 pb-6 relative pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 mb-6">
              <div className="h-24 w-24 rounded-2xl bg-role-surface border-4 border-role-card-bg shadow-xl flex items-center justify-center font-bold text-3xl text-role-primary">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{user?.name}</h1>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-role-primary" />
                  {user?.email}
                </p>
              </div>
              <Badge className="sm:ml-auto bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                System Administrator
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Assigned College / Institution</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-role-primary" />
                  {getCollegeName(user?.collegeId || 'college-a')}
                </p>
                <p className="text-xs text-slate-500 font-medium">Tenant ID: {user?.collegeId || 'college-a'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Security & Access Privileges</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Full System Super-Admin Scope
                </p>
                <p className="text-xs text-slate-500 font-medium">Status: ACTIVE</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
