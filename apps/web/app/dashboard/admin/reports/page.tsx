'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Button } from '@campus-connect/ui';
import { LineChart, FileSpreadsheet, Download, FileText, ChevronRight, BarChart3, PieChart, Users } from 'lucide-react';

interface ReportTemplate {
  name: string;
  description: string;
  category: string;
  lastGenerated: string;
}

export default function ReportsAndAnalytics() {
  const [reports] = useState<ReportTemplate[]>([
    { name: 'Student Enrollment Report', description: 'Lists all student registrations grouped by Department, Course, and Semester.', category: 'Students', lastGenerated: 'Today, 10:15 AM' },
    { name: 'Semester Attendance Summary', description: 'Aggregated attendance percentages across all divisions and subjects.', category: 'Attendance', lastGenerated: 'Yesterday, 5:00 PM' },
    { name: 'Teacher Workload & Assignments', description: 'Summary of teaching workloads, subject allotments, and lectures weekly.', category: 'Teachers', lastGenerated: '02 Jul 2026' },
    { name: 'Notes & Learning Center Auditing', description: 'Tracks lecture material uploads, download stats, and moderation metrics.', category: 'Learning Center', lastGenerated: '28 Jun 2026' },
  ]);

  return (
    <DashboardLayout title="Reports & Analytics" icon={<LineChart className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Attendance</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">78.4%</span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">▲ 1.2% from last week</p>
              </div>
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Material Downloads</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">1,842</span>
                <p className="text-[10px] text-blue-600 font-semibold mt-1">▲ 124 files this month</p>
              </div>
              <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                <PieChart className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Event Attendees</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">453 Students</span>
                <p className="text-[10px] text-slate-400 mt-1">Across 3 published events</p>
              </div>
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Custom Report */}
        <Card className="p-5 border-slate-100 dark:border-slate-850">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">Export custom reporting logs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="secondary" className="h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Export Students list</span>
            </Button>
            <Button variant="secondary" className="h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Export Teachers list</span>
            </Button>
            <Button variant="secondary" className="h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Export Academic Report</span>
            </Button>
            <Button className="h-12 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800">
              <Download className="h-4 w-4 mr-1 shrink-0" />
              <span>Generate PDF Summary</span>
            </Button>
          </div>
        </Card>

        {/* Quick template generators */}
        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider pt-2">Available Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((rep, idx) => (
            <Card key={idx} className="hover:border-slate-350 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5 flex justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400">
                    {rep.category}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm pt-1">{rep.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rep.description}</p>
                  <p className="text-[10px] text-slate-450 pt-2">Last Generated: {rep.lastGenerated}</p>
                </div>
                <div className="flex items-center">
                  <Button variant="secondary" className="h-9 w-9 p-0 rounded-lg flex items-center justify-center">
                    <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
