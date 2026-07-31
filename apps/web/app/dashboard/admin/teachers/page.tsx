'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Input, Badge } from '@campus-connect/ui';
import { Search, Plus, UserX, UserCheck, Award, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';

export default function TeacherManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Teacher Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('M.Tech in CS');
  const [subject, setSubject] = useState('Database Systems');
  const [departmentId, setDepartmentId] = useState('');
  const [experience, setExperience] = useState('5');
  const [departments, setDepartments] = useState<any[]>([]);

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTeachers({ collegeId: user?.collegeId });
      if (res.success && res.data) {
        setTeachers(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch teachers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.getDepartments({ collegeId: user?.collegeId });
      if (res.success && res.data) {
        setDepartments(res.data);
        if (res.data.length > 0) setDepartmentId(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch departments:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeachers();
      fetchDepartments();
    }
  }, [user]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      const res = await api.createTeacher({
        name,
        email,
        phone,
        departmentId,
        qualification,
        subject,
        experienceYears: Number(experience) || 0,
      });

      if (res.success) {
        setSuccessMsg(`Teacher "${name}" registered successfully.`);
        setName('');
        setEmail('');
        setPhone('');
        setShowAddModal(false);
        fetchTeachers();
      } else {
        setErrorMsg(res.message || 'Failed to create teacher.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error registering teacher.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  const filteredTeachers = teachers.filter((t: any) => {
    const q = searchQuery.toLowerCase();
    const tName = (t.user?.name || t.name || '').toLowerCase();
    const tId = (t.employeeId || t.empId || '').toLowerCase();
    const tDept = (t.department?.name || t.department || '').toLowerCase();
    const tSub = (t.qualification || t.subject || '').toLowerCase();
    return tName.includes(q) || tId.includes(q) || tDept.includes(q) || tSub.includes(q);
  });

  const activeCount = teachers.filter((t: any) => (t.status || 'ACTIVE') === 'ACTIVE').length;
  const attendancePct = teachers.length > 0 ? Math.round((activeCount / teachers.length) * 100) : 100;

  return (
    <DashboardLayout title="Teacher Management" icon={<Award className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
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

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Faculty</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">{teachers.length}</span>
              </div>
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Attendance Rate</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1 block">{attendancePct}%</span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">On Leave / Suspended</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                  {teachers.filter((t: any) => (t.status || '').includes('LEAVE') || t.status === 'SUSPENDED').length}
                </span>
              </div>
              <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter controls */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search faculty by ID, name, subject or department..."
              className="pl-9 h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            onClick={() => setShowAddModal(true)}
            className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Teacher</span>
          </Button>
        </Card>

        {/* Teachers list table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading faculty roster...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No teachers found in database.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name & Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Qualification & Experience</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((t: any) => (
                  <TableRow key={t.id || t.empId}>
                    <TableCell className="font-semibold text-xs text-slate-555 dark:text-slate-400">
                      {t.employeeId || t.empId || 'TCH-001'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{t.user?.name || t.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.user?.email || t.email} • {t.phone || 'Phone on file'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                      {t.department?.name || t.department || 'Faculty'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{t.qualification || 'M.Tech / PhD'}</p>
                        <p className="text-[10px] text-slate-400">{t.experienceYears || 5} Years Exp.</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(t.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'danger'} className="text-[10px]">
                        {t.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Add Teacher Modal */}
        {showAddModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowAddModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Teacher</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold"
                    >
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Qualification</label>
                    <input
                      type="text"
                      placeholder="e.g. Ph.D. in Computer Science"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Operating Systems"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Experience (Yrs)</label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Register Teacher
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
