'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Toast } from '@campus-connect/ui';
import { Bell, EyeOff, Settings, AlertTriangle } from 'lucide-react';
import { api } from '../../../../utils/api';

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [leaderboardPrivacy, setLeaderboardPrivacy] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNotificationPreferences();
      if (res.success && res.data) {
        setEmailAlerts(res.data.allowEmail);
        setSmsAlerts(res.data.allowSMS);
      } else {
        setError(res.message || 'Failed to retrieve notification preferences.');
      }
    } catch (e) {
      setError('Network connection error while retrieving preferences.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
    const isAnon = localStorage.getItem('cc_leaderboard_privacy') === 'true';
    setLeaderboardPrivacy(isAnon);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('cc_leaderboard_privacy', leaderboardPrivacy.toString());
      const res = await api.updateNotificationPreferences({
        allowEmail: emailAlerts,
        allowSMS: smsAlerts,
        allowPush: !leaderboardPrivacy,
        allowInApp: true
      });
      if (res.success) {
        setToastMsg('Settings saved successfully!');
        setToastType('success');
      } else {
        setToastMsg(res.message || 'Failed to save settings.');
        setToastType('error');
      }
      setToastOpen(true);
    } catch (e) {
      setToastMsg('A network error occurred while saving.');
      setToastType('error');
      setToastOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Preferences & Settings" icon={<Settings className="h-6 w-6" />}>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading student preferences...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Preferences & Settings" icon={<Settings className="h-6 w-6" />}>
        <div className="p-6 bg-red-50/60 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-2xl text-center space-y-4 max-w-md mx-auto mt-12">
          <AlertTriangle className="h-10 w-10 text-red-550 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Settings Connection Offline</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button 
            onClick={fetchPreferences}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Preferences & Settings" icon={<Settings className="h-6 w-6" />}>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {/* Notifications Section */}
        <Card className="border-slate-100 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" /> Notification Settings
            </CardTitle>
            <p className="text-xs text-slate-500">Configure how and when you receive system announcements</p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Notifications</span>
                <p className="text-[10px] text-slate-450 mt-0.5">Receive weekly grade reports and announcement digests</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={() => setEmailAlerts(!emailAlerts)}
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">SMS Alerts</span>
                <p className="text-[10px] text-slate-450 mt-0.5">Receive urgent warnings and class scheduling changes via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={() => setSmsAlerts(!smsAlerts)}
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card className="border-slate-100 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-blue-600" /> Privacy & Leaderboard
            </CardTitle>
            <p className="text-xs text-slate-500">Manage your visibility across classroom rank sheets</p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Leaderboard Anonymity</span>
                <p className="text-[10px] text-slate-450 mt-0.5">Hide your student name on published rankings (shown as Anonymous)</p>
              </div>
              <input
                type="checkbox"
                checked={leaderboardPrivacy}
                onChange={() => setLeaderboardPrivacy(!leaderboardPrivacy)}
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

          </CardContent>
        </Card>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
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
