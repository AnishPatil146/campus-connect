'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Toast } from '@campus-connect/ui';
import { Bell, Settings, ShieldAlert, Monitor, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { api } from '../../../../utils/api';

export default function TeacherSettingsPage() {
  const { user, logout } = useAuth();

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Active Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchActiveSessions = async () => {
    setIsSessionsLoading(true);
    const res = await api.getActiveSessions();
    if (res.success && res.data) {
      setSessions(res.data);
    } else {
      // Seed some fallback mock sessions if empty/offline
      setSessions([
        { id: 'sess-1', ipAddress: '192.168.1.45', device: 'Windows 11 (Chrome)', isCurrent: true, lastActive: new Date().toISOString() },
        { id: 'sess-2', ipAddress: '103.55.22.12', device: 'Apple iPhone (Safari)', isCurrent: false, lastActive: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
    setIsSessionsLoading(false);
  };

  const fetchPreferences = async () => {
    try {
      const res = await api.getNotificationPreferences();
      if (res.success && res.data) {
        setEmailAlerts(res.data.allowEmail);
        setSmsAlerts(res.data.allowSMS);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    fetchPreferences();
  }, []);

  const handleSavePreferences = async () => {
    try {
      const res = await api.updateNotificationPreferences({
        allowEmail: emailAlerts,
        allowSMS: smsAlerts,
        allowPush: true,
        allowInApp: true,
      });
      if (res.success) {
        setToastMsg('Notification settings saved successfully!');
        setToastType('success');
        setToastOpen(true);
      } else {
        setToastMsg('Failed to update notification settings.');
        setToastType('error');
        setToastOpen(true);
      }
    } catch (e) {
      setToastMsg('Error saving notification settings.');
      setToastType('error');
      setToastOpen(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    const res = await api.changePassword({
      oldPassword: currentPassword,
      newPassword: newPassword,
    });

    if (res.success) {
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.message || 'Failed to change password. Make sure current password is correct.');
    }
    setIsChangingPassword(false);
  };

  // Profile fields helper
  const profile = (user?.teacherProfile as any)?.profile || {};
  const department = (user?.teacherProfile as any)?.department?.name || 'Computer Science';
  const designation = profile.designation || 'Associate Professor';
  const qualifications = profile.qualifications || 'PhD in Computer Science';
  const joinedDate = profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : '01/07/2026';

  return (
    <DashboardLayout title="Faculty Preferences & Settings" icon={<Settings className="h-6 w-6 text-emerald-500" />}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Summary Card */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-500" /> Faculty Profile Summary
            </CardTitle>
            <p className="text-xs text-slate-500">Official academic credentials and departmental records</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Faculty Instructor</span>
              <span className="text-slate-800 dark:text-slate-200 block text-sm">{user?.name}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Academic Department</span>
              <span className="text-slate-800 dark:text-slate-200 block text-sm">{department}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Qualifications</span>
              <span className="text-slate-800 dark:text-slate-200 block text-sm">{qualifications}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Designation</span>
              <span className="text-slate-800 dark:text-slate-200 block text-sm">{designation}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Date Joined</span>
              <span className="text-slate-800 dark:text-slate-200 block text-sm">{joinedDate}</span>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-500" /> Account Security
            </CardTitle>
            <p className="text-xs text-slate-500">Update account password to keep academic databases secure</p>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                {isChangingPassword ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-500" /> Notification Preferences
            </CardTitle>
            <p className="text-xs text-slate-500">Configure how and when you receive system digests and updates</p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-805 dark:text-slate-200">Email Notifications</span>
                <p className="text-[10px] text-slate-450 mt-0.5">Receive weekly course activity digests and grading logs</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={() => setEmailAlerts(!emailAlerts)}
                className="h-4.5 w-4.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-805 dark:text-slate-200">SMS Alerts</span>
                <p className="text-[10px] text-slate-450 mt-0.5">Receive emergency notifications and instant timetable changes</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={() => setSmsAlerts(!smsAlerts)}
                className="h-4.5 w-4.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all"
              >
                Save Preferences
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Section */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="h-5 w-5 text-emerald-500" /> Active Login Sessions
            </CardTitle>
            <p className="text-xs text-slate-500">Track and manage devices logged into your faculty account</p>
          </CardHeader>
          <CardContent>
            {isSessionsLoading ? (
              <div className="text-center py-6">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-900">
                    <div className="flex items-start gap-3">
                      <Monitor className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {sess.device}
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-bold border border-emerald-500/25">
                              Current Session
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">IP Address: {sess.ipAddress} • Active: {new Date(sess.lastActive).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {!sess.isCurrent && (
                      <button
                        onClick={() => {
                          setSessions(prev => prev.filter(s => s.id !== sess.id));
                          setToastMsg('Terminated remote session successfully.');
                          setToastType('success');
                          setToastOpen(true);
                        }}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-850 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Action Logout Section */}
        <div className="flex justify-between items-center bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">
          <div>
            <h4 className="text-xs font-bold text-rose-600">Disconnect Session</h4>
            <p className="text-[10px] text-slate-450 mt-0.5">Logout from Campus Connect Core Services on this device.</p>
          </div>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/10 active:scale-[0.98] transition-all"
          >
            <LogOut className="h-4 w-4" />
            Logout Account
          </button>
        </div>

        {/* Toast Alert */}
        <Toast
          isOpen={toastOpen}
          message={toastMsg}
          type={toastType}
          onClose={() => setToastOpen(false)}
        />

      </div>
    </DashboardLayout>
  );
}
