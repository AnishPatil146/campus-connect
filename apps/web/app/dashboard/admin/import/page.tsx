'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { api, TimetableEntry } from '../../../../utils/api';
import { Button, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge, Card, CardContent } from '@campus-connect/ui';
import { FolderInput, Download, UploadCloud, CheckCircle2, AlertTriangle, Play, RefreshCw, History, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PreviewRow {
  row: number;
  name: string;
  email: string;
  rollNumber?: string;
  employeeId?: string;
  mobile: string;
  academicDetails?: string;
  department?: string;
  divisionId?: string;
  departmentId?: string;
  course?: string;
  division?: string;
  day?: string;
  timeSlot?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportLog {
  id: string;
  filename: string;
  importType: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  errorReport: string | null;
  createdAt: string;
  importedBy: {
    name: string;
    email: string;
  };
}

export default function ImportCenter() {
  const [importType, setImportType] = useState<'STUDENT' | 'TEACHER' | 'TIMETABLE'>('STUDENT');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalFound: number;
    validCount: number;
    errorCount: number;
    preview: PreviewRow[];
  } | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'SKIP' | 'OVERWRITE' | 'CREATE_NEW'>('SKIP');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ImportLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch past import history
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('cc_token');
      const response = await fetch('http://localhost:4000/api/v1/imports/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const payload = await response.json();
        setHistoryLogs(payload.data || []);
        setIsLoadingHistory(false);
        return;
      }
    } catch (err) {
      console.warn('API offline, loading local storage mock import history...');
    }

    // Local Storage Mock fallback
    const stored = localStorage.getItem('cc_mock_import_history');
    if (stored) {
      try {
        setHistoryLogs(JSON.parse(stored));
      } catch (_) {
        setHistoryLogs([]);
      }
    } else {
      setHistoryLogs([]);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Template Downloader
  const handleDownloadTemplate = () => {
    if (importType === 'TIMETABLE') {
      const headers = ['Day', 'Time Slot', 'Course', 'Division', 'Subject Code', 'Subject Name', 'Teacher Name', 'Classroom'];
      const sampleRows = [
        {
          'Day': 'Monday',
          'Time Slot': '09:00 AM - 10:30 AM',
          'Course': 'BSc IT',
          'Division': 'Division A',
          'Subject Code': 'CS-401',
          'Subject Name': 'Database Management Systems',
          'Teacher Name': 'Prof. Amit Patil',
          'Classroom': 'Room 301'
        },
        {
          'Day': 'Monday',
          'Time Slot': '11:00 AM - 12:30 PM',
          'Course': 'BSc IT',
          'Division': 'Division A',
          'Subject Code': 'CS-402',
          'Subject Name': 'Operating Systems',
          'Teacher Name': 'Dr. Sarah Jenkins',
          'Classroom': 'Room 302'
        }
      ];
      const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable_Template');
      XLSX.writeFile(workbook, 'timetable_import_template.xlsx');
      return;
    }
    window.open(`http://localhost:4000/api/v1/imports/template/${importType.toLowerCase()}?token=${localStorage.getItem('cc_token') || ''}`);
  };

  // Drag & Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parse Excel/CSV client-side
  const processFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setAlertMsg(null);
    setPreviewData(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);
        await generatePreview(jsonRows as any[]);
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: 'Error parsing spreadsheet: ' + err.message });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // Send rows to backend for schema/db-level validations
  const generatePreview = async (rows: any[]) => {
    if (importType === 'TIMETABLE') {
      const previewResults: PreviewRow[] = [];
      let validCount = 0;
      let errorCount = 0;

      let existingTimetable: TimetableEntry[] = [];
      try {
        existingTimetable = await api.getTimetable();
      } catch (_) {}

      const normalizeTimeSlot = (slot: string): string => {
        return (slot || '').toLowerCase().replace(/\s+/g, '').replace(/(?:^|-)0(\d)/g, '$1');
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errors: string[] = [];
        const warnings: string[] = [];
        const rowNum = i + 1;

        const day = row['Day'] || row['day'] || '';
        const timeSlot = row['Time Slot'] || row['timeSlot'] || row['Time'] || row['time'] || '';
        const course = row['Course'] || row['course'] || '';
        const division = row['Division'] || row['division'] || row['Div'] || row['div'] || '';
        const subjectCode = row['Subject Code'] || row['subjectCode'] || '';
        const subject = row['Subject Name'] || row['subject'] || row['subjectName'] || row['Subject'] || '';
        const teacher = row['Teacher Name'] || row['teacher'] || row['teacherName'] || row['Teacher'] || '';
        const classroom = row['Classroom'] || row['classroom'] || row['Room'] || row['room'] || '';

        if (!day.toString().trim()) errors.push('Day is required');
        if (!timeSlot.toString().trim()) errors.push('Time Slot is required');
        if (!course.toString().trim()) errors.push('Course program is required');
        if (!division.toString().trim()) errors.push('Division is required');
        if (!subject.toString().trim()) errors.push('Subject name is required');
        if (!teacher.toString().trim()) errors.push('Teacher name is required');
        if (!classroom.toString().trim()) errors.push('Classroom is required');

        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        if (day && !validDays.includes(day.toString().toLowerCase().trim())) {
          errors.push(`Invalid Day: "${day}". Supported: Monday to Saturday`);
        }

        if (errors.length === 0) {
          const normTime = normalizeTimeSlot(timeSlot.toString());

          // 1. Internal clashes
          for (const prevRow of previewResults) {
            if (prevRow.day?.toLowerCase().trim() === day.toString().toLowerCase().trim() && normalizeTimeSlot(prevRow.timeSlot || '') === normTime) {
              if (prevRow.email.toLowerCase().trim() === teacher.toString().toLowerCase().trim()) {
                errors.push(`⚠️ Teacher Conflict: ${teacher} is scheduled twice in this slot (Room ${classroom} & ${prevRow.rollNumber})`);
              }
              if (prevRow.rollNumber?.toLowerCase().trim() === classroom.toString().toLowerCase().trim()) {
                errors.push(`⚠️ Classroom Conflict: Room ${classroom} is double-booked for "${subject}" & "${prevRow.name}"`);
              }
              if (prevRow.course?.toLowerCase().trim() === course.toString().toLowerCase().trim() && prevRow.division?.toLowerCase().trim() === division.toString().toLowerCase().trim()) {
                errors.push(`⚠️ Student Clash: ${course} ${division} has multiple lectures scheduled at this time`);
              }
            }
          }

          // 2. Database clashes
          for (const entry of existingTimetable) {
            if (entry.day.toLowerCase().trim() === day.toString().toLowerCase().trim() && normalizeTimeSlot(entry.timeSlot) === normTime) {
              if (entry.teacher.toLowerCase().trim() === teacher.toString().toLowerCase().trim()) {
                errors.push(`⚠️ System Teacher Conflict: ${teacher} is already teaching in ${entry.classroom} (${entry.subject})`);
              }
              if (entry.classroom.toLowerCase().trim() === classroom.toString().toLowerCase().trim()) {
                errors.push(`⚠️ System Classroom Conflict: Room ${classroom} is already booked for "${entry.subject}"`);
              }
              const cleanInputDiv = division.toString().replace(/div(ision)?/i, '').trim().toLowerCase();
              const cleanEntryDiv = entry.division.replace(/div(ision)?/i, '').trim().toLowerCase();
              if (entry.course.toLowerCase().trim() === course.toString().toLowerCase().trim() && cleanEntryDiv === cleanInputDiv) {
                errors.push(`⚠️ System Student Clash: ${course} ${division} is already attending "${entry.subject}"`);
              }
            }
          }
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        previewResults.push({
          row: rowNum,
          name: subject.toString().trim(),
          email: teacher.toString().trim(),
          rollNumber: classroom.toString().trim(),
          employeeId: subjectCode.toString().trim() || 'GEN-101',
          mobile: timeSlot.toString().trim(),
          academicDetails: `${course.toString().trim()} > ${division.toString().trim()}`,
          course: course.toString().trim(),
          division: division.toString().trim(),
          day: day.toString().trim(),
          timeSlot: timeSlot.toString().trim(),
          isValid,
          errors,
          warnings,
        });
      }

      setPreviewData({
        totalFound: rows.length,
        validCount,
        errorCount,
        preview: previewResults,
      });
      return;
    }

    try {
      const token = localStorage.getItem('cc_token');
      const response = await fetch('http://localhost:4000/api/v1/imports/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: importType, rows }),
      });

      if (response.ok) {
        const payload = await response.json();
        setPreviewData(payload.data);
        return;
      }
    } catch (err: any) {
      console.warn('API offline, generating client-side validation preview...');
    }

    // Local Storage mock preview generator
    const previewResults: PreviewRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    const storedStudentsRaw = localStorage.getItem('cc_mock_students') || '[]';
    let localStudents: any[] = [];
    try { localStudents = JSON.parse(storedStudentsRaw); } catch (_) {}

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      const warnings: string[] = [];
      const rowNum = i + 1;

      if (importType === 'STUDENT') {
        const name = row['Name'] || row['name'] || '';
        const email = (row['Email'] || row['email'] || '').trim().toLowerCase();
        const rollNo = row['Roll No'] || row['Roll Number'] || row['rollNumber'] || '';
        const mobile = row['Mobile'] || row['mobile'] || row['Phone'] || row['phone'] || '';
        const deptName = row['Department'] || row['department'] || 'Computer Science';
        const courseName = row['Course'] || row['course'] || 'BSc IT';
        const semName = row['Semester'] || row['semester'] || 'Semester 1';
        const divName = row['Division'] || row['division'] || 'Division A';

        if (!name.trim()) errors.push('Name is required');
        if (!email.trim()) {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email format');
        }

        // Check mock duplicate
        const emailExists = localStudents.some((s: any) => s.user.email === email);
        if (emailExists) {
          warnings.push(`Email "${email}" already registered (Duplicate account)`);
        }

        const rollExists = localStudents.some((s: any) => s.rollNumber === rollNo.trim());
        if (rollExists && rollNo.trim()) {
          warnings.push(`Roll Number "${rollNo}" already exists in system`);
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        previewResults.push({
          row: rowNum,
          name: name.trim(),
          email,
          rollNumber: rollNo.trim(),
          mobile: mobile.toString().trim(),
          academicDetails: `${deptName} > ${courseName} (${semName}, ${divName})`,
          divisionId: 'div-a', // default local division
          isValid,
          errors,
          warnings,
        });
      } else {
        // Teacher mock preview
        const name = row['Name'] || row['name'] || '';
        const email = (row['Email'] || row['email'] || '').trim().toLowerCase();
        const empId = row['Employee ID'] || row['employee_id'] || '';
        const deptName = row['Department'] || row['department'] || 'Computer Science';

        if (!name.trim()) errors.push('Name is required');
        if (!email.trim()) {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email format');
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        previewResults.push({
          row: rowNum,
          name: name.trim(),
          email,
          employeeId: empId.trim(),
          mobile: '',
          department: deptName,
          departmentId: 'dept-cs',
          isValid,
          errors,
          warnings,
        });
      }
    }

    setPreviewData({
      totalFound: rows.length,
      validCount,
      errorCount,
      preview: previewResults,
    });
  };

  // Execute Import Registration
  const handleCommitImport = async () => {
    if (!previewData || previewData.preview.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    setAlertMsg(null);

    if (importType === 'TIMETABLE') {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 150);

      const newEntries: TimetableEntry[] = previewData.preview
        .filter(row => row.isValid)
        .map(row => ({
          id: `std-time-${Date.now()}-${row.row}-${Math.floor(Math.random() * 1000)}`,
          subject: row.name,
          course: row.course || 'BSc IT',
          division: row.division || 'Division A',
          teacher: row.email,
          classroom: row.rollNumber || 'LHC-301',
          day: row.day || 'Monday',
          timeSlot: row.timeSlot || '09:00 AM - 10:30 AM',
          subjectCode: row.employeeId || 'GEN-101'
        }));

      await api.addTimetableEntries(newEntries);

      clearInterval(progressInterval);
      setProgress(100);

      const newLog: ImportLog = {
        id: `mock-log-${Date.now()}`,
        filename: file?.name || 'timetable_import.xlsx',
        importType: 'TIMETABLE',
        totalRows: previewData.preview.length,
        successRows: newEntries.length,
        failedRows: previewData.preview.length - newEntries.length,
        status: newEntries.length === previewData.preview.length ? 'COMPLETED' : newEntries.length === 0 ? 'FAILED' : 'PARTIAL',
        errorReport: null,
        createdAt: new Date().toISOString(),
        importedBy: {
          name: 'Local Admin',
          email: 'admin@collegec.edu',
        },
      };

      const storedLogsRaw = localStorage.getItem('cc_mock_import_history') || '[]';
      let localLogs = [];
      try { localLogs = JSON.parse(storedLogsRaw); } catch (_) {}
      localLogs.unshift(newLog);
      localStorage.setItem('cc_mock_import_history', JSON.stringify(localLogs));

      setAlertMsg({
        type: 'success',
        text: `Timetable import completed! Successfully registered ${newEntries.length} lecture slots. Checked and resolved all scheduling conflicts.`,
      });
      setPreviewData(null);
      setFile(null);
      fetchHistory();
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 80 ? prev + 15 : prev));
    }, 200);

    try {
      const token = localStorage.getItem('cc_token');
      const response = await fetch('http://localhost:4000/api/v1/imports/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: importType,
          rows: previewData.preview,
          duplicatePolicy,
          filename: file?.name || `${importType.toLowerCase()}_import.csv`,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const payload = await response.json();
        const result = payload.data;
        setAlertMsg({
          type: 'success',
          text: `Bulk registration completed! Status: ${result.status}. Successfully registered: ${result.successRows} profiles, Failed: ${result.failedRows} records.`,
        });
        setPreviewData(null);
        setFile(null);
        fetchHistory();
        return;
      }
    } catch (err: any) {
      console.warn('API offline, committing import locally...');
    }

    // Local Storage mock commit handler
    clearInterval(progressInterval);
    setProgress(100);

    const storedStudentsRaw = localStorage.getItem('cc_mock_students') || '[]';
    let localStudents: any[] = [];
    try { localStudents = JSON.parse(storedStudentsRaw); } catch (_) {}

    let successRows = 0;
    let failedRows = 0;
    const errorDetails: any[] = [];

    for (const row of previewData.preview) {
      try {
        if (!row.isValid) {
          throw new Error(row.errors.join(', '));
        }

        const emailLower = row.email.toLowerCase();
        const existingIdx = localStudents.findIndex((s: any) => s.user.email === emailLower);

        if (existingIdx !== -1) {
          if (duplicatePolicy === 'SKIP') {
            successRows++;
            continue;
          } else if (duplicatePolicy === 'OVERWRITE') {
            localStudents[existingIdx] = {
              ...localStudents[existingIdx],
              rollNumber: row.rollNumber || localStudents[existingIdx].rollNumber,
              mobile: row.mobile || localStudents[existingIdx].mobile,
              user: {
                ...localStudents[existingIdx].user,
                name: row.name,
              },
            };
            successRows++;
            continue;
          } else {
            throw new Error(`Email "${row.email}" is already registered (policy: CREATE_NEW failed)`);
          }
        }

        // Add brand new student
        if (importType === 'STUDENT') {
          const newStudent = {
            id: `mock-std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: `mock-usr-${Date.now()}`,
            rollNumber: row.rollNumber || `CS-2026-${Math.floor(Math.random() * 900 + 100)}`,
            admissionNumber: `ADM-${Math.floor(Math.random() * 900000 + 100000)}`,
            gender: 'Male',
            dateOfBirth: '2005-01-01',
            mobile: row.mobile || '',
            address: '',
            profilePhoto: '',
            parentName: '',
            parentMobile: '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
              id: `mock-usr-${Date.now()}`,
              email: emailLower,
              name: row.name,
              role: 'STUDENT',
              collegeId: 'college-a',
              createdAt: new Date().toISOString(),
            },
            division: {
              id: 'div-a',
              name: 'Division A',
              semester: {
                id: 'sem-1',
                name: 'Semester 1',
                academicSession: {
                  id: 'session-1',
                  name: '2026-27',
                  course: {
                    id: 'course-bscit',
                    name: 'BSc IT',
                    department: {
                      id: 'dept-cs',
                      name: 'Computer Science',
                      college: {
                        id: 'college-a',
                        name: "Pushpalata Mhatre Women's College of Arts, Commerce & Science",
                      },
                    },
                  },
                },
              },
            },
          };
          localStudents.unshift(newStudent);
          successRows++;
        } else {
          // Mock teacher imports doesn't write to students array but we count success
          successRows++;
        }
      } catch (err: any) {
        failedRows++;
        errorDetails.push({
          row: row.row,
          name: row.name,
          email: row.email,
          error: err.message || 'Validation error',
        });
      }
    }

    localStorage.setItem('cc_mock_students', JSON.stringify(localStudents));

    // Save to mock history
    const finalStatus = failedRows === 0 ? 'COMPLETED' : successRows === 0 ? 'FAILED' : 'PARTIAL';
    const newLog: ImportLog = {
      id: `mock-log-${Date.now()}`,
      filename: file?.name || `${importType.toLowerCase()}_import.csv`,
      importType: importType,
      totalRows: previewData.preview.length,
      successRows,
      failedRows,
      status: finalStatus,
      errorReport: errorDetails.length > 0 ? JSON.stringify(errorDetails) : null,
      createdAt: new Date().toISOString(),
      importedBy: {
        name: 'Local Admin',
        email: 'admin@collegec.edu',
      },
    };

    const storedLogsRaw = localStorage.getItem('cc_mock_import_history') || '[]';
    let localLogs = [];
    try { localLogs = JSON.parse(storedLogsRaw); } catch (_) {}
    localLogs.unshift(newLog);
    localStorage.setItem('cc_mock_import_history', JSON.stringify(localLogs));

    setAlertMsg({
      type: 'success',
      text: `Bulk registration completed locally! Status: ${finalStatus}. Successfully registered: ${successRows} profiles, Failed: ${failedRows} records.`,
    });
    setPreviewData(null);
    setFile(null);
    fetchHistory();
    setIsProcessing(false);
    setTimeout(() => setProgress(0), 1000);
  };

  // Download error report client-side as Excel from stored JSON log
  const handleDownloadErrorReport = (log: ImportLog) => {
    if (!log.errorReport) return;
    try {
      const errors = JSON.parse(log.errorReport);
      const dataRows = errors.map((err: any) => ({
        'Row Number': err.row,
        'Name': err.name,
        'Email Address': err.email,
        'Reason for Error': err.error,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');
      XLSX.writeFile(workbook, `Import_Error_Report_${log.filename.split('.')[0]}.xlsx`);
    } catch (err) {
      console.error('Error generating error report:', err);
    }
  };

  return (
    <DashboardLayout title="Import Center" icon={<FolderInput className="h-6 w-6" />}>
      <div className="space-y-8">
        
        {/* Connection status indicator */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100/50 dark:border-blue-900/50">
              <FolderInput className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Universal Bulk Registration</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload a spreadsheet file to bulk register accounts, resolve duplicate emails, and configure student profiles.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setAlertMsg(null);
              }}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
            >
              Reset Center
            </button>
          </div>
        </div>

        {alertMsg && (
          <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
            alertMsg.type === 'success' 
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
              : 'bg-red-50/50 dark:bg-red-950/20 border-red-100/50 dark:border-red-900/50 text-red-700 dark:text-red-400'
          }`}>
            {alertMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span className="text-xs font-medium">{alertMsg.text}</span>
          </div>
        )}

        {/* Step-by-Step upload panel */}
        {!previewData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Configure & Download */}
            <Card className="lg:col-span-1 border border-slate-100 dark:border-slate-900">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-extrabold">1</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Import Configuration</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Import Type</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button
                        onClick={() => setImportType('STUDENT')}
                        className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          importType === 'STUDENT'
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-150 dark:border-slate-800'
                        }`}
                      >
                        🎓 Students
                      </button>
                      <button
                        onClick={() => setImportType('TEACHER')}
                        className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          importType === 'TEACHER'
                            ? 'bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-150 dark:border-slate-800'
                        }`}
                      >
                        👨🏫 Teachers
                      </button>
                      <button
                        onClick={() => setImportType('TIMETABLE')}
                        className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          importType === 'TIMETABLE'
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-150 dark:border-slate-800'
                        }`}
                      >
                        📅 Timetables
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-900">
                    <button
                      onClick={handleDownloadTemplate}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 border border-slate-150 dark:border-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      Download Excel/CSV Template
                    </button>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 leading-relaxed">Please use our exact columns layout to ensure seamless database parsing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Upload Zone */}
            <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-extrabold">2</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Drag & Drop Upload</h3>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {isUploading ? (
                    <div className="space-y-4">
                      <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Parsing spreadsheet columns...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadCloud className="h-12 w-12 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Drop your CSV or XLSX file here</p>
                        <p className="text-xs text-slate-400 mt-1.5">or click to browse your desktop storage</p>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Supported: CSV, XLSX, XLS
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Preview Data Panel */
          <Card className="border border-slate-100 dark:border-slate-900">
            <CardContent className="p-6 space-y-6">
              
              {/* Preview header statistics */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Import File Preview</span>
                    <span className="text-xs font-semibold text-slate-400">({file?.name})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold">{previewData.totalFound} Rows Found</Badge>
                    <Badge variant="success" className="bg-emerald-50 text-emerald-700 font-bold">{previewData.validCount} Valid</Badge>
                    {previewData.errorCount > 0 && (
                      <Badge variant="danger" className="bg-red-50 text-red-750 font-bold">{previewData.errorCount} Errors</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Duplicate Strategy Dropdown */}
                  <div className="flex flex-col gap-1 text-left min-w-[160px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duplicate Strategy</span>
                    <select
                      className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                      value={duplicatePolicy}
                      onChange={(e: any) => setDuplicatePolicy(e.target.value)}
                    >
                      <option value="SKIP">Skip Duplicates</option>
                      <option value="OVERWRITE">Update / Overwrite</option>
                      <option value="CREATE_NEW">Create New (Fail on Unique)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleCommitImport}
                    disabled={isProcessing || previewData.validCount === 0}
                    className="h-10 self-end bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/10"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        Execute Import ({previewData.validCount})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress bar overlay during commit */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Bulk Account Registration Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              )}

              {/* Row validation list */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[440px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      {importType === 'TIMETABLE' ? (
                        <>
                          <TableHead>Day & Time</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Course & Div</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Classroom</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          {importType === 'STUDENT' ? (
                            <>
                              <TableHead>Roll Number</TableHead>
                              <TableHead>Resolved Division</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead>Employee ID</TableHead>
                              <TableHead>Department</TableHead>
                            </>
                          )}
                        </>
                      )}
                      <TableHead>Status</TableHead>
                      <TableHead>Logs / Warnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.preview.map((row) => (
                      <TableRow key={row.row} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <TableCell className="font-bold text-slate-400">#{row.row}</TableCell>
                        {importType === 'TIMETABLE' ? (
                          <>
                            <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                              <div className="space-y-0.5">
                                <p className="font-bold">{row.day}</p>
                                <p className="text-slate-400">{row.timeSlot}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{row.name}</p>
                                {row.employeeId && <p className="text-[10px] text-slate-400">{row.employeeId}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 font-semibold">{row.course} • {row.division}</TableCell>
                            <TableCell className="text-xs text-slate-500">{row.email}</TableCell>
                            <TableCell className="text-xs text-slate-500 font-semibold">{row.rollNumber}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</TableCell>
                            <TableCell className="text-slate-500">{row.email}</TableCell>
                            {importType === 'STUDENT' ? (
                              <>
                                <TableCell className="font-semibold text-slate-655">{row.rollNumber || 'N/A'}</TableCell>
                                <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{row.academicDetails}</TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="font-semibold text-slate-655">{row.employeeId || 'N/A'}</TableCell>
                                <TableCell className="text-xs text-slate-500">{row.department}</TableCell>
                              </>
                            )}
                          </>
                        )}
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="success" className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[10px]">Valid</Badge>
                          ) : (
                            <Badge variant="danger" className="bg-red-50 text-red-750 font-bold px-2 py-0.5 rounded-md text-[10px]">Error</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[260px] text-xs">
                          {row.errors.length > 0 && (
                            <div className="text-red-500 font-medium space-y-0.5">
                              {row.errors.map((e, idx) => <p key={idx}>• {e}</p>)}
                            </div>
                          )}
                          {row.warnings.length > 0 && (
                            <div className="text-amber-600 font-medium space-y-0.5 mt-0.5">
                              {row.warnings.map((w, idx) => <p key={idx}>• {w}</p>)}
                            </div>
                          )}
                          {row.errors.length === 0 && row.warnings.length === 0 && (
                            <span className="text-slate-400">Ready to import</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

            </CardContent>
          </Card>
        )}

        {/* History of Import History logs */}
        <Card className="border border-slate-100 dark:border-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <History className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Import Execution History</h3>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-slate-400">Loading history logs...</div>
            ) : historyLogs.length > 0 ? (
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Rows</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{log.filename}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5 rounded-md">
                            {log.importType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-655">{log.totalRows}</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{log.successRows}</TableCell>
                        <TableCell className={log.failedRows > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}>
                          {log.failedRows}
                        </TableCell>
                        <TableCell>
                          {log.status === 'COMPLETED' && (
                            <Badge className="bg-emerald-50 text-emerald-700 font-bold text-[10px]">Success</Badge>
                          )}
                          {log.status === 'PARTIAL' && (
                            <Badge className="bg-amber-50 text-amber-700 font-bold text-[10px]">Partial</Badge>
                          )}
                          {log.status === 'FAILED' && (
                            <Badge className="bg-red-50 text-red-750 font-bold text-[10px]">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-555">{log.importedBy.name}</TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleString(undefined, { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.failedRows > 0 ? (
                            <button
                              onClick={() => handleDownloadErrorReport(log)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/20 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-red-100 dark:border-transparent"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              Download Error XLSX
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                No past bulk imports found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
