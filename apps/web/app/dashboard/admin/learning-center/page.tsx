'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { BookOpen, FileText, Download, CheckCircle, XCircle, Eye } from 'lucide-react';

interface StudyNote {
  id: string;
  title: string;
  course: string;
  semester: string;
  subject: string;
  uploadedBy: string;
  downloads: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function LearningCenter() {
  const [notes, setNotes] = useState<StudyNote[]>([
    { id: '1', title: 'DBMS Relational Algebra Handout', course: 'BSc IT', semester: 'Sem 3', subject: 'DBMS', uploadedBy: 'Prof. Amit Patil', downloads: 42, status: 'APPROVED' },
    { id: '2', title: 'System Programming Unit 1 Guide', course: 'BSc IT', semester: 'Sem 3', subject: 'System Programming', uploadedBy: 'Dr. Sarah Jenkins', downloads: 0, status: 'PENDING' },
    { id: '3', title: 'Java Complete Syllabus PPT', course: 'BSc IT', semester: 'Sem 5', subject: 'Java Programming', uploadedBy: 'Prof. Amit Patil', downloads: 125, status: 'APPROVED' },
  ]);

  const approveNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, status: 'APPROVED' } : n));
  };

  const rejectNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, status: 'REJECTED' } : n));
  };

  return (
    <DashboardLayout title="Learning Center" icon={<BookOpen className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Statistics info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Moderation Queue</span>
                <span className="text-2xl font-extrabold text-amber-500 mt-1 block">
                  {notes.filter(n => n.status === 'PENDING').length} Pending files
                </span>
              </div>
              <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Shared Files</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {notes.length} Study Materials
                </span>
              </div>
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content list */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">
            Syllabus Material Moderation
          </h3>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Title</TableHead>
                <TableHead>Course / Semester</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{n.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-350">{n.course} • {n.semester}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-semibold">{n.subject}</TableCell>
                  <TableCell className="text-xs text-slate-500">{n.uploadedBy}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>{n.downloads}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={n.status === 'APPROVED' ? 'success' : n.status === 'PENDING' ? 'warning' : 'danger'} className="text-[10px]">
                      {n.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg inline-flex items-center" title="View Document">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {n.status === 'PENDING' && (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => approveNote(n.id)} 
                          className="h-8 text-xs text-emerald-600 hover:text-emerald-700 rounded-lg inline-flex items-center"
                          title="Approve File"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => rejectNote(n.id)} 
                          className="h-8 text-xs text-red-600 hover:text-red-700 rounded-lg inline-flex items-center"
                          title="Reject File"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
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
