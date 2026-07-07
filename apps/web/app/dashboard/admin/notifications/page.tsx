'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Bell, Plus, Eye } from 'lucide-react';

interface NotificationLog {
  id: string;
  message: string;
  recipientGroup: string;
  sentAt: string;
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
}

export default function NotificationCenter() {
  const [logs] = useState<NotificationLog[]>([
    { id: '1', message: 'Urgent: Exam Hall Allocation PDF published. Please review your seating arrangement.', recipientGroup: 'All Students', sentAt: 'Today, 2:30 PM', status: 'SENT' },
    { id: '2', message: 'Staff Meeting Reminder: Monthly review scheduled tomorrow in Seminar Hall 1.', recipientGroup: 'All Teachers', sentAt: 'Yesterday, 4:00 PM', status: 'SENT' },
    { id: '3', message: 'Holiday notice for Independence Day broadcasted.', recipientGroup: 'Entire College', sentAt: '03 Jul 2026', status: 'SENT' },
    { id: '4', message: 'Alert: Fee submission deadline notice scheduled for next week.', recipientGroup: 'BSc IT Sem 5', sentAt: 'Scheduled: 12 Jul', status: 'SCHEDULED' },
  ]);

  return (
    <DashboardLayout title="Notification Center" icon={<Bell className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Top actions panel */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Push & SMS Notification Center</h4>
            <p className="text-xs text-slate-400 mt-0.5">Push announcements directly to mobile apps and send SMS reminders.</p>
          </div>
          
          <Button className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Send Alert</span>
          </Button>
        </Card>

        {/* Sent logs */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification Message</TableHead>
                <TableHead>Target Recipient</TableHead>
                <TableHead>Sent Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-md">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">{log.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ref ID: CC-NOTIF-{log.id}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold text-slate-600">
                      {log.recipientGroup}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-555">{log.sentAt}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'SENT' ? 'success' : 'secondary'} className="text-[10px]">
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg inline-flex items-center gap-1" title="View details">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
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
