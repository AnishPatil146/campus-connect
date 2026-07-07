'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Toast } from '@campus-connect/ui';
import { Bell, EyeOff, Settings } from 'lucide-react';

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [leaderboardPrivacy, setLeaderboardPrivacy] = useState(false);
  
  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleSave = () => {
    setToastMsg('Settings saved successfully!');
    setToastOpen(true);
  };

  return (
    <DashboardLayout title="Preferences & Settings" icon={<Settings className="h-6 w-6" />}>
      <div className="max-w-3xl mx-auto space-y-6">
        
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
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
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
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
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
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
            </div>

          </CardContent>
        </Card>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
          >
            Save Settings
          </button>
        </div>

        {/* Toast Alert */}
        <Toast
          isOpen={toastOpen}
          message={toastMsg}
          type="success"
          onClose={() => setToastOpen(false)}
        />

      </div>
    </DashboardLayout>
  );
}
