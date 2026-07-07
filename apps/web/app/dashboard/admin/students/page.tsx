'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Button, 
  Input, 
  Badge, 
  Modal,
  EmptyState,
  Card,
  CardContent
} from '@campus-connect/ui';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Key, 
  UserMinus, 
  GraduationCap, 
  Info,
  AlertCircle,
  FileSpreadsheet,
  X,
  RefreshCw
} from 'lucide-react';
import { api, StudentRecord } from '../../../../utils/api';
import { CollegeId } from '@campus-connect/types';

export default function StudentsDirectory() {
  // Query Filters State
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [semFilter, setSemFilter] = useState('all');
  const [divFilter, setDivFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Students list and loading states
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected student states for Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  
  // Modals visibility states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [customResetPassword, setCustomResetPassword] = useState('');
  
  // Form properties
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'academic' | 'parent'>('personal');

  // Add/Edit Student Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'Male',
    dateOfBirth: '',
    mobile: '',
    address: '',
    profilePhoto: '',
    rollNumber: '',
    admissionNumber: '',
    collegeId: 'college-c' as CollegeId,
    divisionId: 'div-a',
    parentName: '',
    parentMobile: '',
  });

  // Action status message
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Bulk actions and promotion states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSourceDiv, setPromoteSourceDiv] = useState('div-a');
  const [promoteTargetDiv, setPromoteTargetDiv] = useState('div-a');
  const [promoteFailedIds, setPromoteFailedIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);

  // Fetch students function
  const fetchStudents = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const resp = await api.getStudents({
        search,
        collegeId: collegeFilter,
        departmentId: deptFilter,
        courseId: courseFilter,
        semesterId: semFilter,
        divisionId: divFilter,
        status: statusFilter,
      });
      setStudents(resp.data);
      setIsDevMode(resp.fromCache);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to retrieve students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, collegeFilter, deptFilter, courseFilter, semFilter, divFilter, statusFilter]);

  // Handle Add Student modal trigger
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setActiveFormTab('personal');
    setFormData({
      name: '',
      email: '',
      gender: 'Male',
      dateOfBirth: '',
      mobile: '',
      address: '',
      profilePhoto: '',
      rollNumber: '',
      admissionNumber: '',
      collegeId: 'college-c',
      divisionId: 'div-a',
      parentName: '',
      parentMobile: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Handle Edit Student modal trigger
  const handleOpenEdit = (student: StudentRecord) => {
    setIsEditMode(true);
    setSelectedStudent(student);
    setActiveFormTab('personal');
    setFormData({
      name: student.user.name,
      email: student.user.email,
      gender: student.gender || 'Male',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      mobile: student.mobile || '',
      address: student.address || '',
      profilePhoto: student.profilePhoto || '',
      rollNumber: student.rollNumber || '',
      admissionNumber: student.admissionNumber || '',
      collegeId: student.user.collegeId,
      divisionId: student.division.id,
      parentName: student.parentName || '',
      parentMobile: student.parentMobile || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    // simple validations
    if (!formData.name || !formData.email) {
      setAlertMsg({ type: 'error', text: 'Full Name and Email are required.' });
      return;
    }

    try {
      if (isEditMode && selectedStudent) {
        await api.updateStudent(selectedStudent.id, {
          name: formData.name,
          rollNumber: formData.rollNumber,
          admissionNumber: formData.admissionNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          mobile: formData.mobile,
          address: formData.address,
          profilePhoto: formData.profilePhoto,
          parentName: formData.parentName,
          parentMobile: formData.parentMobile,
          divisionId: formData.divisionId,
        });
        setAlertMsg({ type: 'success', text: `Successfully updated profile for ${formData.name}.` });
      } else {
        await api.createStudent({
          email: formData.email,
          name: formData.name,
          rollNumber: formData.rollNumber,
          admissionNumber: formData.admissionNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          mobile: formData.mobile,
          address: formData.address,
          profilePhoto: formData.profilePhoto,
          parentName: formData.parentName,
          parentMobile: formData.parentMobile,
          divisionId: formData.divisionId,
          collegeId: formData.collegeId,
        });
        setAlertMsg({ type: 'success', text: `Successfully registered student ${formData.name}.` });
      }
      setIsAddEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Operation failed. Try again.' });
    }
  };

  // Delete Action handler
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    try {
      await api.deleteStudent(selectedStudent.id);
      setAlertMsg({ type: 'success', text: `Successfully soft-deleted student ${selectedStudent.user.name}.` });
      setIsDeleteConfirmOpen(false);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to delete student.' });
    }
  };

  // Password Reset handler
  const handleResetConfirm = async () => {
    if (!selectedStudent) return;
    try {
      await api.resetPassword(selectedStudent.id, customResetPassword || undefined);
      setAlertMsg({ 
        type: 'success', 
        text: customResetPassword 
          ? `Successfully changed password for ${selectedStudent.user.name} to "${customResetPassword}".`
          : `Successfully reset password to 'password123' for ${selectedStudent.user.name}.` 
      });
      setIsResetConfirmOpen(false);
      setCustomResetPassword('');
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to reset password.' });
    }
  };

  // Bulk Actions Handlers
  const handleBulkResetPassword = async () => {
    if (selectedStudentIds.length === 0) return;
    try {
      await Promise.all(selectedStudentIds.map(id => api.resetPassword(id)));
      setAlertMsg({ type: 'success', text: `Successfully reset password for ${selectedStudentIds.length} selected students.` });
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to reset one or more student passwords.' });
    }
  };

  const handleBulkDisable = async () => {
    if (selectedStudentIds.length === 0) return;
    try {
      await Promise.all(selectedStudentIds.map(id => api.updateStudent(id, { isActive: false })));
      setAlertMsg({ type: 'success', text: `Successfully disabled ${selectedStudentIds.length} selected student accounts.` });
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to disable one or more student accounts.' });
    }
  };

  const handleBulkChangeDivision = async () => {
    if (selectedStudentIds.length === 0) return;
    const targetDiv = window.prompt("Enter target Division ID (e.g. 'div-a' or 'div-b'):");
    if (!targetDiv) return;
    try {
      await Promise.all(selectedStudentIds.map(id => api.updateStudent(id, { divisionId: targetDiv })));
      setAlertMsg({ type: 'success', text: `Successfully moved ${selectedStudentIds.length} students to division "${targetDiv}".` });
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to transfer division for one or more students.' });
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPromoting(true);
    try {
      const token = localStorage.getItem('cc_token');
      const response = await fetch('http://localhost:4000/api/v1/imports/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceDivisionId: promoteSourceDiv,
          targetDivisionId: promoteTargetDiv,
          failedStudentIds: promoteFailedIds,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        setAlertMsg({
          type: 'success',
          text: `Promotion successful! Promoted: ${payload.data.promotedCount} students, Kept back: ${payload.data.skippedCount} students.`,
        });
        setIsPromoteModalOpen(false);
        fetchStudents();
      } else {
        const payload = await response.json();
        throw new Error(payload.message || 'Promotion request failed.');
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to execute bulk promotion.' });
    } finally {
      setIsPromoting(false);
    }
  };

  // Export to CSV simulation
  const handleExportStudents = () => {
    if (students.length === 0) return;
    
    // Create CSV rows
    const headers = ['Roll No', 'Name', 'Email', 'Gender', 'Course', 'Semester', 'Division', 'Status'];
    const rows = students.map(s => [
      s.rollNumber || 'N/A',
      s.user.name,
      s.user.email,
      s.gender || 'N/A',
      s.division.semester.academicSession.course.name,
      s.division.semester.name,
      s.division.name,
      s.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setAlertMsg({ type: 'success', text: `Successfully exported ${students.length} students to CSV.` });
  };

  // Disable all filtered student accounts
  const handleDisableAccounts = () => {
    if (students.length === 0) return;
    students.forEach(async (s) => {
      if (s.isActive) {
        await api.updateStudent(s.id, { isActive: false });
      }
    });
    setAlertMsg({ type: 'success', text: `Disabled ${students.filter(s => s.isActive).length} active student accounts.` });
    setTimeout(fetchStudents, 500);
  };

  // Pagination Helper
  const paginatedStudents = students.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(students.length / itemsPerPage) || 1;

  // Form handle changes
  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout title="Students Directory" icon={<GraduationCap className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Connection status indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl px-6 py-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isDevMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {isDevMode ? 'Running in Local Storage (Offline Mock Mode)' : 'Connected to NestJS API Database'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsPromoteModalOpen(true)}
              variant="outline"
              className="h-9 px-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-955/20 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Bulk Promotion</span>
            </Button>
            <Button
              onClick={handleExportStudents}
              variant="outline"
              className="h-9 px-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              onClick={handleDisableAccounts}
              variant="outline"
              className="h-9 px-3 rounded-xl border border-red-200/60 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 text-xs font-medium text-red-650 hover:bg-red-55 flex items-center gap-1.5"
            >
              <UserMinus className="h-3.5 w-3.5" />
              <span>Disable Accounts</span>
            </Button>
            <Button 
              onClick={handleOpenAdd}
              className="h-9 px-3.5 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Student</span>
            </Button>
          </div>
        </div>

        {/* Selected Students Action Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl px-6 py-4 transition-all">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
              Selected {selectedStudentIds.length} Students
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleBulkResetPassword}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                Reset Passwords
              </button>
              <button
                onClick={handleBulkDisable}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 border border-red-100 dark:border-transparent"
              >
                Disable Profiles
              </button>
              <button
                onClick={handleBulkChangeDivision}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                Change Division
              </button>
              <button
                onClick={() => setSelectedStudentIds([])}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {/* Global toast notification */}
        {alertMsg && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            alertMsg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              <Info className="h-4.5 w-4.5 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Table & Filtering Page Layout */}
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header controls & Filters */}
          <div className="p-6 border-b border-slate-50 dark:border-slate-900 space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <Input
                placeholder="Search students by roll number, name, or email..."
                className="pl-10.5 h-11 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter selectors grid */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">College</label>
                <select
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-205 bg-white dark:bg-slate-950 text-xs px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">All Colleges</option>
                  <option value="college-a">Pushpalata Mhatre Women's College of Arts, Commerce & Science</option>
                  <option value="college-b">Balasaheb Mhatre College of Science (Junior)</option>
                  <option value="college-c">Balasaheb Mhatre College of Science (Senior)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-205 bg-white dark:bg-slate-950 text-xs px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">All Depts</option>
                  <option value="dept-cs">Computer Science</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Course</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-205 bg-white dark:bg-slate-950 text-xs px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">All Courses</option>
                  <option value="course-bscit">BSc IT</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Semester</label>
                <select
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-205 bg-white dark:bg-slate-950 text-xs px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">All Semesters</option>
                  <option value="sem-1">Semester 1</option>
                  <option value="sem-2">Semester 2</option>
                  <option value="sem-3">Semester 3</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Division</label>
                <select
                  value={divFilter}
                  onChange={(e) => setDivFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-205 bg-white dark:bg-slate-950 text-xs px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">All Divisions</option>
                  <option value="div-a">Division A</option>
                  <option value="div-b">Division B</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-205 bg-white dark:bg-slate-950 text-xs px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deleted">Soft Deleted</option>
                </select>
              </div>

              <div className="flex items-end justify-end">
                <Button 
                  onClick={() => {
                    setSearch('');
                    setCollegeFilter('all');
                    setDeptFilter('all');
                    setCourseFilter('all');
                    setSemFilter('all');
                    setDivFilter('all');
                    setStatusFilter('active');
                  }}
                  variant="secondary"
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  Reset Filters
                </Button>
              </div>

            </div>
          </div>

          {/* Table content */}
          <CardContent className="p-0">
            {errorMessage ? (
              <div className="py-24 text-center text-red-500 text-sm flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            ) : isLoading ? (
              <div className="py-24 text-center text-slate-400 text-sm">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4" />
                Retrieving student records...
              </div>
            ) : paginatedStudents.length === 0 ? (
              <EmptyState
                title="No students found"
                description="Try broadening your search keywords or updating your active filters."
                icon={<GraduationCap className="h-8 w-8 text-slate-300" />}
                className="py-16"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 pl-6">
                      <input
                        type="checkbox"
                        className="rounded border-slate-305 text-blue-600 focus:ring-blue-500"
                        checked={paginatedStudents.length > 0 && selectedStudentIds.length === paginatedStudents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds(paginatedStudents.map(s => s.id));
                          } else {
                            setSelectedStudentIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-16">Photo</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="pl-6 w-12">
                        <input
                          type="checkbox"
                          className="rounded border-slate-305 text-blue-600 focus:ring-blue-500"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={student.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                          alt={student.user.name}
                          className="h-9 w-9 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80';
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-xs">
                        {student.rollNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{student.user.name}</span>
                          <span className="text-[10px] font-normal text-slate-400">{student.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.division.semester.academicSession.course.name}</TableCell>
                      <TableCell>{student.division.semester.name}</TableCell>
                      <TableCell>{student.division.name}</TableCell>
                      <TableCell>
                        <Badge variant={student.isActive ? 'success' : 'danger'}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-50 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50/50 transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setCustomResetPassword('');
                              setIsResetConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50/50 transition-colors"
                            title="Reset Password"
                          >
                            <Key className="h-4.5 w-4.5" />
                          </button>

                          {student.isActive && (
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setIsDeleteConfirmOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50/50 transition-colors"
                              title="Delete (Soft)"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination controls footer */}
          {students.length > 0 && (
            <div className="p-5 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, students.length)} of {students.length} students
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  variant="secondary"
                  className="h-8.5 px-3.5 rounded-lg text-xs"
                >
                  Previous
                </Button>
                <div className="text-xs font-semibold text-slate-600 px-2.5">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  variant="secondary"
                  className="h-8.5 px-3.5 rounded-lg text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>

      {/* ----------------- MODAL: VIEW STUDENT DETAILS ----------------- */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Student Profile Details"
        size="md"
      >
        {selectedStudent && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex items-center gap-4.5 pb-5 border-b border-slate-50 dark:border-slate-900">
              <img
                src={selectedStudent.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={selectedStudent.user.name}
                className="h-16 w-16 rounded-2xl object-cover border border-slate-100"
              />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-tight">{selectedStudent.user.name}</h3>
                <p className="text-xs text-slate-400">{selectedStudent.user.email}</p>
                <Badge variant={selectedStudent.isActive ? 'success' : 'danger'} className="mt-1.5">
                  {selectedStudent.isActive ? 'Active Account' : 'Disabled Account'}
                </Badge>
              </div>
            </div>

            {/* Information Grid */}
            <div className="space-y-5">
              
              {/* Section: Academic */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-50 dark:border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Roll Number</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.rollNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Admission Number</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.admissionNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Course & Department</span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                      {selectedStudent.division.semester.academicSession.course.name} ({selectedStudent.division.semester.academicSession.course.department.name})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Semester / Division</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStudent.division.semester.name} - {selectedStudent.division.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section: Personal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-50 dark:border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Gender</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Date of Birth</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Mobile Number</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.mobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Address</span>
                    <span className="text-xs font-medium text-slate-805 dark:text-slate-250 leading-relaxed block">{selectedStudent.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section: Parent */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-50 dark:border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Parent Name</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.parentName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Parent Mobile</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.parentMobile || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-50 dark:border-slate-900">
              <Button onClick={() => setIsViewModalOpen(false)} className="h-9 px-4.5 rounded-xl bg-slate-905 text-white">
                Close Profile
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* ----------------- MODAL: ADD / EDIT STUDENT ----------------- */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={isEditMode ? 'Edit Student Details' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          {/* Tab toggles */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-850">
            
            <button
              type="button"
              onClick={() => setActiveFormTab('personal')}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                activeFormTab === 'personal'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1. Personal Information
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('academic')}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                activeFormTab === 'academic'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              2. Academic Information
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('parent')}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                activeFormTab === 'parent'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              3. Parent Information
            </button>

          </div>

          {/* Form Tabs Content */}
          <div className="min-h-[220px]">
            
            {/* Tab: Personal */}
            {activeFormTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                  <Input
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    disabled={isEditMode}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleFormChange('gender', e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Mobile Number</label>
                  <Input
                    placeholder="e.g. +91 9876543210"
                    value={formData.mobile}
                    onChange={(e) => handleFormChange('mobile', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Profile Photo URL</label>
                  <Input
                    placeholder="https://images.unsplash.com/... or relative path"
                    value={formData.profilePhoto}
                    onChange={(e) => handleFormChange('profilePhoto', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Residential Address</label>
                  <Input
                    placeholder="Enter permanent address details"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Tab: Academic */}
            {activeFormTab === 'academic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Roll Number</label>
                  <Input
                    placeholder="e.g. CS-2026-089"
                    value={formData.rollNumber}
                    onChange={(e) => handleFormChange('rollNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Admission Number</label>
                  <Input
                    placeholder="e.g. ADM-902341"
                    value={formData.admissionNumber}
                    onChange={(e) => handleFormChange('admissionNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">College Scope</label>
                  <select
                    value={formData.collegeId}
                    disabled={isEditMode}
                    onChange={(e) => handleFormChange('collegeId', e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1"
                  >
                    <option value="college-a">Pushpalata Mhatre Women's College of Arts, Commerce & Science</option>
                    <option value="college-b">Balasaheb Mhatre College of Science (Junior)</option>
                    <option value="college-c">Balasaheb Mhatre College of Science (Senior)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Division Segment</label>
                  <select
                    value={formData.divisionId}
                    onChange={(e) => handleFormChange('divisionId', e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1"
                  >
                    <option value="div-a">Division A</option>
                    <option value="div-b">Division B</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Academic Session</label>
                  <Input value="2026-27" disabled />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Department</label>
                  <Input value="Computer Science" disabled />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Course & Sem</label>
                  <Input value="BSc IT (Semester 1)" disabled />
                </div>
              </div>
            )}

            {/* Tab: Parent */}
            {activeFormTab === 'parent' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Parent Name</label>
                  <Input
                    placeholder="Enter parent or guardian full name"
                    value={formData.parentName}
                    onChange={(e) => handleFormChange('parentName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Parent Mobile</label>
                  <Input
                    placeholder="e.g. +91 9876543211"
                    value={formData.parentMobile}
                    onChange={(e) => handleFormChange('parentMobile', e.target.value)}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-900">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={activeFormTab === 'personal'}
                onClick={() => {
                  if (activeFormTab === 'academic') setActiveFormTab('personal');
                  else if (activeFormTab === 'parent') setActiveFormTab('academic');
                }}
                className="h-9 px-4 rounded-xl border"
              >
                Previous Step
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={activeFormTab === 'parent'}
                onClick={() => {
                  if (activeFormTab === 'personal') setActiveFormTab('academic');
                  else if (activeFormTab === 'academic') setActiveFormTab('parent');
                }}
                className="h-9 px-4 rounded-xl border"
              >
                Next Step
              </Button>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                variant="secondary"
                className="h-9 px-4.5 rounded-xl border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4.5 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-850"
              >
                {isEditMode ? 'Save Profile' : 'Register Student'}
              </Button>
            </div>
          </div>

        </form>
      </Modal>

      {/* ----------------- MODAL: DELETE CONFIRMATION ----------------- */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Student?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Are you absolutely sure?</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                This student will be moved to the recycle bin (soft-deleted) and their account status will mark as inactive. You can restore this student profile later if needed.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-50 dark:border-slate-900">
            <Button
              onClick={() => setIsDeleteConfirmOpen(false)}
              variant="secondary"
              className="h-9.5 px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="h-9.5 px-4.5 rounded-xl bg-red-600 text-white hover:bg-red-750 text-xs font-bold border border-transparent shadow-sm"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* ----------------- MODAL: RESET PASSWORD CONFIRMATION ----------------- */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset Password?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Change User Password</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reset or set a custom password for student <b>{selectedStudent?.user.name}</b>.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              New Password (Optional)
            </label>
            <Input
              type="text"
              placeholder="Leave empty to use default 'password123'"
              value={customResetPassword}
              onChange={(e) => setCustomResetPassword(e.target.value)}
              className="w-full h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-50 dark:border-slate-900">
            <Button
              onClick={() => setIsResetConfirmOpen(false)}
              variant="secondary"
              className="h-9.5 px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetConfirm}
              className="h-9.5 px-4.5 rounded-xl bg-slate-950 text-white hover:bg-slate-850 text-xs font-semibold"
            >
              {customResetPassword ? 'Set Custom Password' : 'Reset to Default'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ----------------- MODAL: BULK PROMOTION WIZARD ----------------- */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Academic Year Bulk Promotion Wizard"
        size="md"
      >
        <form onSubmit={handlePromoteSubmit} className="space-y-4">
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-4 rounded-2xl flex gap-3 text-blue-700 dark:text-blue-400">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              This tool bulk-promotes students from one division to another (e.g. Sem 1 → Sem 2). Backlogged students can be kept back by checking their names.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 font-sans">Source Division</label>
              <select
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1"
                value={promoteSourceDiv}
                onChange={(e) => setPromoteSourceDiv(e.target.value)}
              >
                <option value="div-a">Division A (Semester 1)</option>
                <option value="div-b">Division B (Semester 1)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 font-sans">Target Division</label>
              <select
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1"
                value={promoteTargetDiv}
                onChange={(e) => setPromoteTargetDiv(e.target.value)}
              >
                <option value="div-a">Division A (Semester 2)</option>
                <option value="div-b">Division B (Semester 2)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">Keep Back / Backlog Students</label>
            <div className="border border-slate-150 dark:border-slate-800 rounded-xl max-h-[160px] overflow-y-auto p-3 space-y-2.5">
              {students
                .filter((s) => s.division.id === promoteSourceDiv)
                .map((student) => {
                  const isExcluded = promoteFailedIds.includes(student.id);
                  return (
                    <label key={student.id} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPromoteFailedIds((prev) => [...prev, student.id]);
                          } else {
                            setPromoteFailedIds((prev) => prev.filter((id) => id !== student.id));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{student.user.name} ({student.rollNumber || 'No Roll No'})</span>
                    </label>
                  );
                })}
              {students.filter((s) => s.division.id === promoteSourceDiv).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No students currently in this division.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={() => setIsPromoteModalOpen(false)}
              variant="secondary"
              className="h-9.5 px-4.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPromoting}
              className="h-9.5 px-4.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
            >
              {isPromoting ? 'Promoting...' : 'Promote Class'}
            </Button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  );
}
