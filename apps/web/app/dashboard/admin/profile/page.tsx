'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { useAuth } from '../../../../components/AuthProvider';
import { getCollegeName } from '@campus-connect/utils';
import { User as UserIcon, Mail, Shield, Building2, ShieldCheck, Key, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AdminProfilePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="System Administrator Profile" icon={<UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Profile Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden transition-all">
          {/* Vibrant Top Banner */}
          <div className="h-32 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="px-6 pb-6 relative pt-0">
            {/* Avatar & Header Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 mb-6">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center font-black text-3xl shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              
              <div className="text-center sm:text-left space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white truncate">{user?.name || 'Administrator'}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <ShieldCheck className="h-3 w-3" /> System Administrator
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span>{user?.phone || '+91 9900990099'}</span>
                </p>
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
              {/* Institution Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned College / Institution</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span>{getCollegeName(user?.collegeId || 'college-a')}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">Tenant ID: {user?.collegeId || 'college-a'}</p>
              </div>

              {/* Security Privileges Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security & Access Scope</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Shield className="h-4 w-4" />
                  </span>
                  <span>Full System Super-Admin Scope</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Account Status: ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Admin Quick Action Shortcuts */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-3">
              <Link
                href="/dashboard/admin/settings"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all flex items-center gap-2"
              >
                <Key className="h-3.5 w-3.5" /> Workspace Settings
              </Link>
              <Link
                href="/dashboard/admin/audit-logs"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Activity className="h-3.5 w-3.5" /> View Audit Logs
              </Link>
              <Link
                href="/dashboard/admin"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Calendar className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
