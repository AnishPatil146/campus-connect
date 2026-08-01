'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { ClipboardCheck, PhoneCall, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';

export default function AdminLeaveManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'TEACHERS' | 'STUDENTS'>('TEACHERS');
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student Parent Call Verification Checklist Modal
  const [verifyingStudentRequest, setVerifyingStudentRequest] = useState<any | null>(null);
  const [parentCallConfirmed, setParentCallConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        api.getTeacherLeaves(),
        api.getStudentLeaves(),
      ]);
      if (tRes.success && tRes.data) setTeacherLeaves(tRes.data);
      if (sRes.success && sRes.data) setStudentLeaves(sRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaveRequests();
    }
  }, [user]);

  const handleApproveTeacherLeave = async (id: string) => {
    try {
      const res = await api.approveTeacherLeave(id);
      if (res.success) {
        setSuccessMsg('Teacher leave approved successfully!');
        fetchLeaveRequests();
      } else {
        setErrorMsg(res.message || 'Failed to approve teacher leave.');
      }
    } catch (err: any) {
      // Handles atomic server-side 2-leave limit error
      setErrorMsg(err.message || 'Atomic check failed: Maximum 2 approved teacher leaves per calendar day reached!');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 5000);
    }
  };

  const handleRejectTeacherLeave = async (id: string) => {
    try {
      const res = await api.rejectTeacherLeave(id);
      if (res.success) {
        setSuccessMsg('Teacher leave request rejected.');
        fetchLeaveRequests();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting leave.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  const handleConfirmStudentLeaveApproval = async () => {
    if (!verifyingStudentRequest || !parentCallConfirmed) return;
    try {
      const res = await api.approveStudentLeave(verifyingStudentRequest.id, {
        parentVerified: true,
        parentNotes: notes || 'Parent confirmed leave via phone call.',
      });
      if (res.success) {
        setSuccessMsg(`Student leave for ${verifyingStudentRequest.student?.user?.name || 'Student'} approved after parent verification.`);
        setVerifyingStudentRequest(null);
        setParentCallConfirmed(false);
        setNotes('');
        fetchLeaveRequests();
      } else {
        setErrorMsg(res.message || 'Failed to approve student leave.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification checklist requirement failed.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 5000);
    }
  };

  return (
    <DashboardLayout title="Leave Approvals & Verification Command" icon={<ClipboardCheck className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('TEACHERS')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'TEACHERS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Teacher Leave Requests ({teacherLeaves.filter(l => l.status === 'PENDING').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'STUDENTS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Student Leave Requests ({studentLeaves.filter(l => l.status === 'PENDING').length} Pending)
          </button>
        </div>

        {/* TEACHER LEAVES TAB */}
        {activeTab === 'TEACHERS' && (
          <Card className="overflow-hidden">
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Atomic Server-Side Constraint: Maximum 2 approved teacher leaves per calendar day.</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading teacher leave requests...</div>
            ) : teacherLeaves.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No teacher leave requests found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Reason & Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherLeaves.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{l.teacher?.user?.name || l.teacherName || 'Faculty'}</p>
                          <p className="text-[10px] text-slate-400">{l.teacher?.department?.name || 'Department'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{l.reason}</p>
                        <p className="text-[10px] text-slate-400">{new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {l.daysCount || 1} day(s)
                      </TableCell>
                      <TableCell>
                        <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'PENDING' ? 'warning' : 'danger'} className="text-[10px]">
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1.5">
                        {l.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleApproveTeacherLeave(l.id)}
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg inline-flex items-center gap-1 font-bold"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              onClick={() => handleRejectTeacherLeave(l.id)}
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs text-rose-600 hover:bg-rose-50 rounded-lg inline-flex items-center gap-1 font-bold"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {/* STUDENT LEAVES TAB */}
        {activeTab === 'STUDENTS' && (
          <Card className="overflow-hidden">
            <div className="p-4 bg-purple-500/10 border-b border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-2">
              <PhoneCall className="h-4 w-4 shrink-0 text-purple-500" />
              <span>Mandatory Protocol: Admin must verify parent phone call before student leave approval.</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading student leave requests...</div>
            ) : studentLeaves.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No student leave requests found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Parent Phone</TableHead>
                    <TableHead>Reason & Dates</TableHead>
                    <TableHead>Parent Verified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentLeaves.map((sl: any) => (
                    <TableRow key={sl.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{sl.student?.user?.name || sl.studentName || 'Student'}</p>
                          <p className="text-[10px] text-slate-400">{sl.student?.division?.name || 'Division A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {sl.student?.parentPhone || sl.parentPhone || '+91 9876543210'}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{sl.reason}</p>
                        <p className="text-[10px] text-slate-400">{new Date(sl.startDate).toLocaleDateString()} — {new Date(sl.endDate).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sl.parentVerified ? 'success' : 'warning'} className="text-[10px]">
                          {sl.parentVerified ? 'CALL VERIFIED' : 'PENDING CALL'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sl.status === 'PENDING' && (
                          <Button
                            onClick={() => setVerifyingStudentRequest(sl)}
                            className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span>Verify Parent & Approve</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {/* Parent Call Verification Checklist Modal */}
        {verifyingStudentRequest && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setVerifyingStudentRequest(null)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-purple-50/50 dark:bg-purple-950/20">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Parent Phone Verification Protocol</h3>
                </div>
                <button onClick={() => setVerifyingStudentRequest(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1 text-xs">
                  <p><strong className="text-slate-800 dark:text-slate-200">Student:</strong> {verifyingStudentRequest.student?.user?.name || 'Student'}</p>
                  <p><strong className="text-slate-800 dark:text-slate-200">Parent Phone on File:</strong> {verifyingStudentRequest.student?.parentPhone || '+91 9876543210'}</p>
                  <p><strong className="text-slate-800 dark:text-slate-200">Requested Reason:</strong> {verifyingStudentRequest.reason}</p>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={parentCallConfirmed}
                      onChange={(e) => setParentCallConfirmed(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                      I confirm that I have called the parent on the phone number listed above and obtained verbal authorization for this leave request.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Parent Conversation Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter details of conversation with parent..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    onClick={() => setVerifyingStudentRequest(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmStudentLeaveApproval}
                    disabled={!parentCallConfirmed}
                    className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                      parentCallConfirmed ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed'
                    }`}
                  >
                    Confirm & Approve Leave
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
