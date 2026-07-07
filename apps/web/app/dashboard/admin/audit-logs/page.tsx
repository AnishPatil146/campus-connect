'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge, Input } from '@campus-connect/ui';
import { Activity, Search, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  role: string;
  action: string;
  details: string;
}

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  
  const [logs] = useState<AuditLog[]>([
    { id: '1001', timestamp: '05 Jul 2026, 10:15 AM', userName: 'Anish Patil', role: 'ADMIN', action: 'Added Student', details: 'Added student profile for Alex Rivera (student@college.edu)' },
    { id: '1002', timestamp: '05 Jul 2026, 10:18 AM', userName: 'Anish Patil', role: 'ADMIN', action: 'Created User Account', details: 'Generated credentials and user record for Alex Rivera' },
    { id: '1003', timestamp: '05 Jul 2026, 11:20 AM', userName: 'Dr. Sarah Jenkins', role: 'TEACHER', action: 'Uploaded Lecture Notes', details: 'Uploaded Operating Systems lecture handout for Semester 3 Unit 1' },
    { id: '1004', timestamp: '05 Jul 2026, 01:45 PM', userName: 'Anish Patil', role: 'ADMIN', action: 'Created Event', details: 'Created event "Tech Connect Hackathon 2026" with 150 capacity' },
  ]);

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Audit Logs" icon={<Activity className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Security Warning */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-250">Immutable Audit Trail active</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              All admin, teacher and student actions are securely logged for accountability and compliance auditing. Logs cannot be modified.
            </p>
          </div>
        </div>

        {/* Search filter */}
        <Card className="p-4 flex items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search logs by user, action, details..."
              className="pl-9 h-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Button variant="secondary" className="h-10 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            <span>Refresh</span>
          </Button>
        </Card>

        {/* Logs Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Operation Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-semibold text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-white text-sm">{log.userName}</TableCell>
                  <TableCell>
                    <Badge variant={log.role === 'ADMIN' ? 'success' : 'secondary'} className="text-[9px]">
                      {log.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-650 dark:text-slate-300">{log.action}</TableCell>
                  <TableCell className="text-xs text-slate-500 leading-relaxed">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>
    </DashboardLayout>
  );
}
