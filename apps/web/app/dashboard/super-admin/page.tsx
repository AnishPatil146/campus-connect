'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@campus-connect/ui';
import { Building2, Megaphone, Trash2, CheckCircle2 } from 'lucide-react';

interface CollegeRecord {
  id: string;
  name: string;
  code: string;
  students: number;
  teachers: number;
  status: 'active' | 'maintenance';
}

interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  target: string;
  date: string;
}

export default function SuperAdminDashboard() {
  const [colleges, setColleges] = useState<CollegeRecord[]>([
    { id: '1', name: 'Apex Institute of Technology', code: 'AIT', students: 1420, teachers: 85, status: 'active' },
    { id: '2', name: 'Beacon College of Engineering', code: 'BCE', students: 1205, teachers: 78, status: 'active' },
    { id: '3', name: 'Crown Business School', code: 'CBS', students: 840, teachers: 42, status: 'active' },
  ]);

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([
    { id: '1', title: 'System Upgrade Maintenance Schedule', content: 'The Campus Connect system will undergo a maintenance window this Sunday between 2 AM to 4 AM EST.', target: 'All Colleges', date: '2026-07-04' },
    { id: '2', title: 'Inter-College Hackathon Registrations Open', content: 'Registrations are open for the annual tri-college coding hackathon starting next month.', target: 'All Colleges', date: '2026-07-02' },
  ]);

  // Form states
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('All Colleges');

  const [successCollege, setSuccessCollege] = useState<string | null>(null);
  const [successAnn, setSuccessAnn] = useState<string | null>(null);

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName || !newCollegeCode) {
      alert('Please fill in college name and code.');
      return;
    }

    const newCol: CollegeRecord = {
      id: `col-${Date.now()}`,
      name: newCollegeName,
      code: newCollegeCode.toUpperCase(),
      students: 0,
      teachers: 0,
      status: 'active',
    };

    setColleges(prev => [...prev, newCol]);
    setSuccessCollege(`Successfully registered college "${newCollegeName}"!`);
    setNewCollegeName('');
    setNewCollegeCode('');

    setTimeout(() => setSuccessCollege(null), 3000);
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      alert('Please fill in announcement title and description.');
      return;
    }

    const newAnn: AnnouncementRecord = {
      id: `ann-${Date.now()}`,
      title: annTitle,
      content: annContent,
      target: annTarget,
      date: new Date().toISOString().split('T')[0],
    };

    setAnnouncements(prev => [newAnn, ...prev]);
    setSuccessAnn(`Successfully posted announcement "${annTitle}"!`);
    setAnnTitle('');
    setAnnContent('');

    setTimeout(() => setSuccessAnn(null), 3000);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Aggregated Stats
  const totalColleges = colleges.length;
  const totalStudents = colleges.reduce((acc, c) => acc + c.students, 0);
  const totalTeachers = colleges.reduce((acc, c) => acc + c.teachers, 0);

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Stats, College list, and Global Announcements */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Colleges</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalColleges}</span>
            </Card>
            <Card className="p-4 bg-white border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalStudents.toLocaleString()}</span>
            </Card>
            <Card className="p-4 bg-white border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Faculty</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalTeachers.toLocaleString()}</span>
            </Card>
          </div>

          {/* College Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {colleges.map((col) => (
              <Card key={col.id} className="p-4 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-40">
                <div className="flex justify-between items-start">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded uppercase">
                    {col.code}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mt-2 line-clamp-1">{col.name}</h4>
                  <div className="flex gap-3 text-[10px] text-slate-500 mt-3">
                    <span>{col.students} students</span>
                    <span>{col.teachers} faculty</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Managed Global Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Global Announcements Board</CardTitle>
              <p className="text-xs text-slate-500">Universal notices published to all college student/faculty portals</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all duration-200 flex justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{ann.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ann.content}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Target: {ann.target} • Posted {ann.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-fit shrink-0 transition-colors"
                    title="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Setup Panels */}
        <div className="space-y-6">
          
          {/* Post Global Announcement Form */}
          <Card className="border-indigo-100 shadow-md">
            <CardHeader>
              <CardTitle>Post System Bulletin</CardTitle>
              <p className="text-xs text-slate-500">Publish notice system-wide</p>
            </CardHeader>
            <CardContent>
              {successAnn && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successAnn}</span>
                </div>
              )}

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Bulletin Title
                  </label>
                  <Input
                    placeholder="e.g. Server Maintenance Notice"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Target Colleges
                  </label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <option value="All Colleges">All Colleges</option>
                    <option value="college-a">College A only</option>
                    <option value="college-b">College B only</option>
                    <option value="college-c">College C only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Bulletin Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Type the announcement description..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-sm shadow-md"
                >
                  Publish Notice
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Register College Form */}
          <Card className="border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle>Register New College</CardTitle>
              <p className="text-xs text-slate-500 font-sans">Onboard a new educational branch</p>
            </CardHeader>
            <CardContent>
              {successCollege && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successCollege}</span>
                </div>
              )}

              <form onSubmit={handleAddCollege} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    College Name
                  </label>
                  <Input
                    placeholder="e.g. Apex Institute"
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    College Code / Abbreviation
                  </label>
                  <Input
                    placeholder="e.g. AIT"
                    value={newCollegeCode}
                    onChange={(e) => setNewCollegeCode(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-sm shadow-md"
                >
                  Add College Branch
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
