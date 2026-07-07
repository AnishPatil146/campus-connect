'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Button, Input } from '@campus-connect/ui';
import { Settings, Save, ShieldCheck, Mail, Palette, Building } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { getCollegeName, getCollegeLogo } from '@campus-connect/utils';

export default function CollegeSettings() {
  const { user } = useAuth();
  
  const [collegeName, setCollegeName] = useState(user ? getCollegeName(user.collegeId) : '');
  const [session, setSession] = useState('2026-27');
  const [emailHost, setEmailHost] = useState('smtp.college.edu');
  const [logoUrl] = useState(user ? getCollegeLogo(user.collegeId) : '');

  return (
    <DashboardLayout title="College Settings" icon={<Settings className="h-6 w-6" />}>
      <div className="space-y-6 max-w-4xl">
        
        {/* Settings categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Left quick settings nav */}
          <div className="md:col-span-1 space-y-2">
            <button className="w-full text-left p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-950/20 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>College Info</span>
            </button>
            <button className="w-full text-left p-3.5 rounded-xl border border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>Branding Theme</span>
            </button>
            <button className="w-full text-left p-3.5 rounded-xl border border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Password Policy</span>
            </button>
            <button className="w-full text-left p-3.5 rounded-xl border border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email Server Config</span>
            </button>
          </div>

          {/* Settings details form */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Institution Info Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Institution Details</h3>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-1 bg-white flex items-center justify-center shadow-sm shrink-0">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Upload New Logo</Button>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG up to 1MB</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <Input 
                    label="College Name" 
                    type="text" 
                    value={collegeName} 
                    onChange={(e) => setCollegeName(e.target.value)} 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Active Academic Session" 
                      type="text" 
                      value={session} 
                      onChange={(e) => setSession(e.target.value)} 
                    />
                    <Input 
                      label="Contact Helpline" 
                      type="text" 
                      defaultValue="+91 22 2543 9080" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Server Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">SMTP Server Configuration</h3>
                <div className="space-y-3.5">
                  <Input 
                    label="SMTP Host Address" 
                    type="text" 
                    value={emailHost} 
                    onChange={(e) => setEmailHost(e.target.value)} 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="SMTP Port" type="text" defaultValue="587" />
                    <Input label="Encryption Type" type="text" defaultValue="STARTTLS" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" className="h-10 px-4 rounded-xl text-xs font-semibold">Discard Changes</Button>
              <Button className="h-10 px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 flex items-center gap-1.5">
                <Save className="h-4 w-4 shrink-0" />
                <span>Save Configuration</span>
              </Button>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
