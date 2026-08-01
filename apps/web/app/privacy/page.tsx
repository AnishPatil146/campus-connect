'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, UserCheck, Server, Mail } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-xs font-semibold gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Campus Connect
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 text-[10px] uppercase font-bold tracking-wider">
              DPDP Act 2023 Compliant
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Page Hero */}
        <div className="space-y-4 text-center sm:text-left border-b border-slate-200/60 dark:border-slate-800/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" /> Data Governance & Security Standard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Privacy Policy & Data Rights
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Campus Connect is committed to safeguarding academic, attendance, and personal data for students, faculty, and institutions under the Digital Personal Data Protection (DPDP) Act 2023.
          </p>
          <p className="text-xs text-slate-400 font-mono pt-1">
            Last Updated: August 1, 2026 • Version 1.0.1
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">

          {/* Section 1: Overview */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-500" /> 1. Data Collection & Academic Purpose
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <p>
                Campus Connect processes personal data solely for legitimate educational administration, attendance verification, timetable scheduling, academic reporting, and campus communication.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li><strong>Student Information:</strong> Name, Roll Number, Admission ID, Course, Division, Marks, and Attendance Logs.</li>
                <li><strong>Parent/Guardian Contact:</strong> Parent Name, Mobile Number (collected strictly for automated attendance alert notifications and leave request verifications).</li>
                <li><strong>Faculty Information:</strong> Name, Department, Employee ID, Qualifications, Timetable Schedules, and Study Material uploads.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 2: DPDP Act 2023 Rights */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" /> 2. Individual Data Rights (DPDP Act 2023)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-xs sm:text-sm">
              <p>
                Under the Indian Digital Personal Data Protection Act 2023, data principals (students, parents, and teachers) maintain explicit rights regarding their personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Right to Access Summary</h4>
                  <p className="text-[11px] text-slate-500">View all active personal profile records, attendance tallies, and academic grades via user dashboard.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Right to Correction & Erasure</h4>
                  <p className="text-[11px] text-slate-500">Request correction of inaccurate contact numbers or data erasure upon graduation or institution withdrawal.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Grievance Redressal</h4>
                  <p className="text-[11px] text-slate-500">Direct escalation path for data processing inquiries to the institutional Data Protection Officer.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Nomination Right</h4>
                  <p className="text-[11px] text-slate-500">Nominate an authorized guardian to exercise data rights in the event of incapacity.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Data Security & Infrastructure */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-500" /> 3. Data Storage & Encryption Standard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <p>
                Campus Connect employs industry-standard encryption protocols during transit and storage:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li><strong>Encryption in Transit:</strong> All HTTP API calls and mobile client traffic are enforced over 256-bit TLS/HTTPS.</li>
                <li><strong>Encryption at Rest:</strong> Database volumes and document attachments are stored using AES-256 encrypted storage.</li>
                <li><strong>Immutable Audit Logging:</strong> Security-sensitive administrative changes and leave approvals generate immutable audit logs stored in isolated database schemas.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 4: Data Retention & Deletion */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" /> 4. Retention Policy & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs sm:text-sm">
                Academic and attendance logs are retained for the duration of a student's enrolled academic program plus mandatory university compliance retention windows. Personal contact numbers are purged upon account deletion requests processed by campus administration.
              </p>
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Data Protection Officer Inquiry</span>
                    <span className="text-slate-500 dark:text-slate-400">dpo@campusconnect.edu | privacy@campusconnect.app</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer Link */}
        <div className="text-center pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <p className="text-xs text-slate-400">
            © 2026 Campus Connect Inc. All rights reserved. • Built for Pushpalata Mhatre & Balasaheb Mhatre Colleges.
          </p>
        </div>

      </main>
    </div>
  );
}
