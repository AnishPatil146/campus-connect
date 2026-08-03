'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge } from '@campus-connect/ui';
import { BookOpen, FileText, Download, CheckCircle, XCircle, UploadCloud, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';
import { useLoading } from '../../../../components/LoadingProvider';

interface SyllabusParsedResult {
  subjectName: string;
  matchedTeacher: string;
  credits: number;
  theoryPercent: number;
  practicalPercent: number;
  confidenceScore: number;
  needsManualCorrection: boolean;
}

export default function LearningCenter() {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [notes, setNotes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Upload Syllabus Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [levelType, setLevelType] = useState<'COLLEGE' | 'HIGHER_SECONDARY'>('COLLEGE');
  const [parsingResult, setParsingResult] = useState<SyllabusParsedResult | null>(null);
  const [isAiParsing, setIsAiParsing] = useState(false);

  // Success / Error Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [notesRes, deptRes] = await Promise.all([
        api.getNotes({ collegeId: user?.collegeId }),
        api.getDepartments({ collegeId: user?.collegeId }),
      ]);
      if (notesRes.success && notesRes.data) setNotes(notesRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSimulateSyllabusUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsAiParsing(true);
    setParsingResult(null);

    // Simulate Ollama AI parsing execution
    setTimeout(() => {
      const isLowConfidence = fileName.toLowerCase().includes('draft') || fileName.toLowerCase().includes('scan');
      const confidence = isLowConfidence ? 0.62 : 0.94;

      setParsingResult({
        subjectName: 'Advanced Web Architecture',
        matchedTeacher: 'Dr. Sarah Jenkins (Professor)',
        credits: 4,
        theoryPercent: 70,
        practicalPercent: 30,
        confidenceScore: Math.round(confidence * 100),
        needsManualCorrection: isLowConfidence,
      });

      setIsAiParsing(false);
    }, 1500);
  };

  const handleConfirmPublish = async () => {
    if (!parsingResult) return;
    startLoading('Publishing parsed syllabus...');
    try {
      const payload = {
        title: `Syllabus: ${parsingResult.subjectName}`,
        description: `Parsed via Ollama AI. Credits: ${parsingResult.credits}, Theory: ${parsingResult.theoryPercent}%, Practical: ${parsingResult.practicalPercent}%. Matched Teacher: ${parsingResult.matchedTeacher}`,
        category: 'Syllabus',
        subject: parsingResult.subjectName,
        semester: levelType === 'COLLEGE' ? 'Semester 1' : 'Class 11th',
        fileName,
        fileUrl: '/files/syllabus.pdf',
        fileSize: 2048 * 1024,
        mimeType: 'application/pdf',
        status: parsingResult.needsManualCorrection ? 'PENDING' : 'PUBLISHED',
      };

      const res = await api.uploadTeacherNote(payload);
      if (res.success) {
        setSuccessMsg(
          parsingResult.needsManualCorrection
            ? 'Low confidence score detected! Syllabus flagged for manual admin review before publishing.'
            : 'Syllabus successfully parsed & published to department learning center!'
        );
        setShowUploadModal(false);
        setParsingResult(null);
        setFileName('');
        fetchData();
      } else {
        setErrorMsg('Failed to save syllabus.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving syllabus.');
    } finally {
      stopLoading();
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 5000);
    }
  };

  const filteredNotes = notes.filter((n: any) => {
    if (selectedDeptId === 'ALL') return true;
    return (n.departmentId || n.department?.id) === selectedDeptId;
  });

  return (
    <DashboardLayout title="Department Learning Center & Syllabus Registry" icon={<BookOpen className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top Header Controls */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Department Syllabus Hub</h3>
            <p className="text-xs text-slate-500 mt-1">
              Organized semester-wise (College) and subject-wise (11th/12th).
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="h-10 px-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Syllabus PDF (AI Auto-Parse)
          </button>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDeptId('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              selectedDeptId === 'ALL'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Departments ({notes.length})
          </button>
          {departments.map((dept: any) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedDeptId === dept.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Content Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading learning materials...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No syllabus or study documents found for this selection.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Level & Organization</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Author / Faculty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((n: any) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{n.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-350">
                      {n.semester || 'Semester 1'} • {n.division || 'Subject-wise'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-semibold">{n.subject}</TableCell>
                    <TableCell className="text-xs text-slate-500">{n.teacher?.user?.name || n.uploadedBy || 'Faculty'}</TableCell>
                    <TableCell>
                      <Badge variant={n.status === 'PUBLISHED' || n.status === 'APPROVED' ? 'success' : 'warning'} className="text-[10px]">
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <a href={n.fileUrl || '/files/syllabus.pdf'} download={`${n.title || 'Study_Material'}.pdf`} className="p-2 text-slate-400 hover:text-emerald-600 inline-block" title="Download Material">
                        <Download className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Upload & AI Parse Modal */}
        {showUploadModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowUploadModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Syllabus PDF Upload & Ollama AI Parser</h3>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSimulateSyllabusUpload} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Academic Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLevelType('COLLEGE')}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        levelType === 'COLLEGE' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      College (Semester-wise)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLevelType('HIGHER_SECONDARY')}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        levelType === 'HIGHER_SECONDARY' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      11th/12th (Subject-wise)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Syllabus PDF File Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS_Web_Architecture_Syllabus_2026.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAiParsing}
                  className="w-full h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  {isAiParsing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Parsing with Ollama AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Parse Syllabus with Ollama AI</span>
                    </>
                  )}
                </button>
              </form>

              {/* Parsing Output Card */}
              {parsingResult && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Extraction Result</span>
                    <Badge variant={parsingResult.needsManualCorrection ? 'danger' : 'success'} className="text-[10px] font-bold">
                      Confidence: {parsingResult.confidenceScore}%
                    </Badge>
                  </div>

                  {parsingResult.needsManualCorrection && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-xl flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Low confidence (&lt;80%). Flagged for manual admin correction before publishing.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Subject</span>
                      <span className="font-bold text-slate-900 dark:text-white">{parsingResult.subjectName}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Matched Teacher</span>
                      <span className="font-bold text-slate-900 dark:text-white">{parsingResult.matchedTeacher}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Credits</span>
                      <span className="font-bold text-slate-900 dark:text-white">{parsingResult.credits} Credits</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Theory / Practical Split</span>
                      <span className="font-bold text-slate-900 dark:text-white">{parsingResult.theoryPercent}% Theory / {parsingResult.practicalPercent}% Practical</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={handleConfirmPublish}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      {parsingResult.needsManualCorrection ? 'Flag for Manual Correction' : 'Approve & Publish'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
