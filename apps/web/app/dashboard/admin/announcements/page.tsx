'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Megaphone, Plus, Eye } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  category: 'Notice' | 'Result' | 'Holiday' | 'Warning' | 'Exam' | 'General';
  target: string;
  date: string;
  status: 'PUBLISHED' | 'SCHEDULED' | 'DRAFT';
}

export default function AnnouncementCenter() {
  const [announcements] = useState<Announcement[]>([
    { id: '1', title: 'Semester Results Published for Batch 2026', category: 'Result', target: 'Entire College', date: 'Today', status: 'PUBLISHED' },
    { id: '2', title: 'Mid Semester Exam Time Table Updated', category: 'Exam', target: 'BSc IT Semester 3', date: 'Yesterday', status: 'PUBLISHED' },
    { id: '3', title: 'Monsoon Holiday Announcement: Saturday Closed', category: 'Holiday', target: 'Entire College', date: '02 Jul 2026', status: 'PUBLISHED' },
    { id: '4', title: 'Maintenance Notice - Library Server Downtime', category: 'Notice', target: 'Entire College', date: 'Scheduled: 10 Jul', status: 'SCHEDULED' },
  ]);

  return (
    <DashboardLayout title="Announcement Center" icon={<Megaphone className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Top actions panel */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Announcement & Notification Engine</h4>
            <p className="text-xs text-slate-400 mt-0.5">Broadcast important circulars, warnings, and result notices to target groups.</p>
          </div>
          
          <Button className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Publish Announcement</span>
          </Button>
        </Card>

        {/* Announcements list */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Announcement Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target Group</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((ann) => (
                <TableRow key={ann.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{ann.title}</p>
                      <p className="text-xs text-slate-400">Ref ID: CC-AN-{ann.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      ann.category === 'Holiday' ? 'success' : 
                      ann.category === 'Exam' ? 'warning' : 
                      ann.category === 'Warning' ? 'danger' : 'secondary'
                    } className="text-[10px] px-2 py-0.5">
                      {ann.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-350">{ann.target}</TableCell>
                  <TableCell className="text-xs text-slate-555">{ann.date}</TableCell>
                  <TableCell>
                    <Badge variant={ann.status === 'PUBLISHED' ? 'success' : 'secondary'} className="text-[10px]">
                      {ann.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg inline-flex items-center gap-1" title="View details">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>
    </DashboardLayout>
  );
}
