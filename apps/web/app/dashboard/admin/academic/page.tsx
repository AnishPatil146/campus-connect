'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button } from '@campus-connect/ui';
import { Plus, Layers, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';

export default function AcademicManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'subjects'>('departments');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');

  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Department Modal
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [hodId, setHodId] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [university, setUniversity] = useState('Mumbai University');

  // Add Course Modal
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDeptId, setCourseDeptId] = useState('');
  const [courseCollegeId, setCourseCollegeId] = useState('college-c');
  const [courseCredits, setCourseCredits] = useState<number>(120);

  // Add Subject Modal
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectCourseId, setSubjectCourseId] = useState('');
  const [subjectCredits, setSubjectCredits] = useState<number>(4);

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAcademicData = async () => {
    setIsLoading(true);
    try {
      const collegeParam = selectedCollegeFilter === 'all' ? undefined : selectedCollegeFilter;
      const [deptRes, crsRes, subRes, tchRes] = await Promise.all([
        api.getDepartments({ collegeId: collegeParam }),
        api.getCourses({ collegeId: collegeParam }),
        api.getSubjects({ collegeId: collegeParam }),
        api.getTeachers({ collegeId: collegeParam }),
      ]);

      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (crsRes.success && crsRes.data) setCourses(crsRes.data);
      if (subRes.success && subRes.data) setSubjects(subRes.data);
      if (tchRes.success && tchRes.data) setTeachers(tchRes.data);
    } catch (e) {
      console.error('Failed to load academic catalog:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, [user, selectedCollegeFilter]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    try {
      const res = await api.createDepartment({
        name: deptName,
        code: deptCode,
        hodId: hodId || undefined,
        assignedTeacherIds: selectedTeacherIds,
        university,
        collegeId: selectedCollegeFilter === 'all' ? (user?.collegeId || 'college-a') : selectedCollegeFilter,
      });

      if (res.success) {
        setSuccessMsg(`Department "${deptName}" created successfully!`);
        setDeptName('');
        setDeptCode('');
        setSelectedTeacherIds([]);
        setShowAddDeptModal(false);
        fetchAcademicData();
      } else {
        setErrorMsg(res.message || 'Failed to create department.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating department.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseDeptId) {
      setErrorMsg('Please enter course name and select a department.');
      return;
    }

    try {
      const res = await api.createCourse({
        name: courseName,
        code: courseCode || 'PRG-' + Math.floor(Math.random() * 900 + 100),
        departmentId: courseDeptId,
        collegeId: courseCollegeId,
        credits: courseCredits,
      });

      if (res.success) {
        setSuccessMsg(`Course "${courseName}" created successfully for ${courseCollegeId === 'college-a' ? "Pushpalata Women's College" : courseCollegeId === 'college-b' ? 'Balasaheb Junior' : 'Balasaheb Senior'}!`);
        setCourseName('');
        setCourseCode('');
        setShowAddCourseModal(false);
        fetchAcademicData();
      } else {
        setErrorMsg(res.message || 'Failed to create course.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating course.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCourseId) {
      setErrorMsg('Please enter subject name and select a course.');
      return;
    }

    try {
      const res = await api.createSubject({
        name: subjectName,
        code: subjectCode || 'SUB-' + Math.floor(Math.random() * 900 + 100),
        courseId: subjectCourseId,
        credits: subjectCredits,
      });

      if (res.success) {
        setSuccessMsg(`Subject "${subjectName}" added to catalog!`);
        setSubjectName('');
        setSubjectCode('');
        setShowAddSubjectModal(false);
        fetchAcademicData();
      } else {
        setErrorMsg(res.message || 'Failed to create subject.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating subject.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  return (
    <DashboardLayout title="Academic Catalog & Department Management" icon={<Layers className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {/* College Filter Header */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Institution Scope</div>
            <div className="text-sm font-bold">Select Active College Tenant for Academic Operations</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCollegeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCollegeFilter === 'all' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Colleges
            </button>
            <button
              onClick={() => setSelectedCollegeFilter('college-a')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCollegeFilter === 'college-a' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Pushpalata Women's
            </button>
            <button
              onClick={() => setSelectedCollegeFilter('college-b')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCollegeFilter === 'college-b' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Balasaheb Junior
            </button>
            <button
              onClick={() => setSelectedCollegeFilter('college-c')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCollegeFilter === 'college-c' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Balasaheb Senior
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'departments' 
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'courses' 
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'subjects' 
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Subjects ({subjects.length})
          </button>
        </div>

        {/* Tab 1: Departments */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Academic Departments</h3>
              <Button
                onClick={() => setShowAddDeptModal(true)}
                size="sm"
                className="rounded-xl h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Department
              </Button>
            </div>
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading department registry...</div>
              ) : departments.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">No departments found in catalog.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Courses Offered</TableHead>
                      <TableHead>Faculty Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept: any) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                          {dept.name} <span className="text-[10px] text-slate-400 uppercase font-mono ml-1">({dept.code || 'DEPT'})</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{dept.coursesCount || dept.courses?.length || 0} Programs</TableCell>
                        <TableCell className="text-xs text-slate-500">{dept.teachersCount || dept.teachers?.length || 0} Faculty</TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg font-semibold">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}

        {/* Tab 2: Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Courses & Academic Programs</h3>
              <Button
                onClick={() => {
                  if (departments.length > 0) setCourseDeptId(departments[0].id);
                  setShowAddCourseModal(true);
                }}
                size="sm"
                className="rounded-xl h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Course
              </Button>
            </div>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Code</TableHead>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Min. Credits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-500">{c.code || 'PRG-101'}</TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{c.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{c.department?.name || 'Academic Dept'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{c.credits || 120} Credits</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg font-semibold">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Tab 3: Subjects */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Subjects Catalog</h3>
              <Button
                onClick={() => {
                  if (courses.length > 0) setSubjectCourseId(courses[0].id);
                  setShowAddSubjectModal(true);
                }}
                size="sm"
                className="rounded-xl h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Subject
              </Button>
            </div>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Course & Term</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-500">{sub.code || 'SUB-101'}</TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {sub.course?.name || 'Program'}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{sub.credits || 4} HP</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg font-semibold">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Add Department Modal */}
        {showAddDeptModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowAddDeptModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Academic Department</h3>
                <button onClick={() => setShowAddDeptModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Affiliated University / Program</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Head of Department (HOD)</label>
                  <select
                    value={hodId}
                    onChange={(e) => setHodId(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold"
                  >
                    <option value="">Select HOD...</option>
                    {teachers.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.user?.name || t.name} ({t.qualification || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowAddDeptModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Create Department
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Add Course Modal */}
        {showAddCourseModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowAddCourseModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Course / Academic Program</h3>
                <button onClick={() => setShowAddCourseModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target College</label>
                  <select
                    value={courseCollegeId}
                    onChange={(e) => setCourseCollegeId(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 font-bold"
                  >
                    <option value="college-a">Pushpalata Mhatre Women's College (`college-a`)</option>
                    <option value="college-b">Balasaheb Mhatre College (Junior) (`college-b`)</option>
                    <option value="college-c">Balasaheb Mhatre College (Senior) (`college-c`)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Program Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Sc. Computer Science"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Program Code</label>
                    <input
                      type="text"
                      placeholder="e.g. BSCCS-101"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                    <select
                      value={courseDeptId}
                      onChange={(e) => setCourseDeptId(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    >
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Minimum Credits / HP</label>
                    <input
                      type="number"
                      value={courseCredits}
                      onChange={(e) => setCourseCredits(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowAddCourseModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Add Subject Modal */}
        {showAddSubjectModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowAddSubjectModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Subject to Program Catalog</h3>
                <button onClick={() => setShowAddSubjectModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Structures & Algorithms"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS-201"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Program / Course</label>
                    <select
                      value={subjectCourseId}
                      onChange={(e) => setSubjectCourseId(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    >
                      {courses.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Credits / Weightage</label>
                    <input
                      type="number"
                      value={subjectCredits}
                      onChange={(e) => setSubjectCredits(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowAddSubjectModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Add Subject
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
