'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@campus-connect/ui';
import { useAuth } from '../../../components/AuthProvider';
import { Clock, User, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { api, TaskRecord } from '../../../utils/api';

interface StudentGradeRecord {
  id: string;
  name: string;
  rollNo: string;
  course: string;
  marks: number;
  grade: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [students, setStudents] = useState<StudentGradeRecord[]>([
    { id: '1', name: 'Alex Rivera', rollNo: 'STU-2026-089', course: 'Database Management Systems', marks: 88, grade: 'A' },
    { id: '2', name: 'Jordan Patel', rollNo: 'STU-2026-104', course: 'Database Management Systems', marks: 92, grade: 'A+' },
    { id: '3', name: 'Emma Watson', rollNo: 'STU-2026-023', course: 'Database Management Systems', marks: 74, grade: 'B' },
    { id: '4', name: 'Ryan Gosling', rollNo: 'STU-2026-004', course: 'Advanced Web Architecture', marks: 85, grade: 'A' },
  ]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('1');
  const [marks, setMarks] = useState<number>(88);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const coursesTaught = [
    { code: 'CS-401', name: 'Database Management Systems', studentsCount: 42, timing: 'Mon/Wed 9:00 AM' },
    { code: 'CS-502', name: 'Advanced Web Architecture', studentsCount: 28, timing: 'Tue/Thu 11:00 AM' },
  ];

  const handleUpdateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    let gradeLetter = 'F';
    if (marks >= 90) gradeLetter = 'A+';
    else if (marks >= 80) gradeLetter = 'A';
    else if (marks >= 70) gradeLetter = 'B';
    else if (marks >= 60) gradeLetter = 'C';
    else if (marks >= 50) gradeLetter = 'D';

    setStudents(prev =>
      prev.map(s => (s.id === selectedStudentId ? { ...s, marks, grade: gradeLetter } : s))
    );

    const studentName = students.find(s => s.id === selectedStudentId)?.name;
    setSuccessMsg(`Successfully updated grades for ${studentName}! Marks: ${marks}, Grade: ${gradeLetter}`);

    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Task Center State
  const [assignedTasks, setAssignedTasks] = useState<TaskRecord[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  const fetchAssignedTasks = async () => {
    setIsTasksLoading(true);
    try {
      const resp = await api.getAssignedTasks();
      setAssignedTasks(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const handleToggleTask = async (task: TaskRecord) => {
    const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      await api.updateTaskStatus(task.id, newStatus);
      fetchAssignedTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const pendingTasks = assignedTasks.filter(t => t.status === 'PENDING');
  const completedTasks = assignedTasks.filter(t => t.status === 'COMPLETED');

  const stats = [
    { title: "Today's Classes", value: "2", color: "text-role-primary bg-role-surface border border-role-border/50" },
    { title: "Pending Attendance", value: "1", color: "text-amber-600 bg-amber-50 border border-amber-200/50" },
    { title: "Pending Reviews", value: "5", color: "text-rose-600 bg-rose-50 border border-rose-200/50" },
    { title: "Uploaded Notes", value: "12", color: "text-role-primary bg-role-surface border border-role-border/50" },
    { title: "Leave Balance", value: "18 Days", color: "text-emerald-650 bg-emerald-50 border border-emerald-200/50" },
  ];

  return (
    <DashboardLayout title="Teacher Control Panel">
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-role-primary via-role-secondary to-role-tertiary rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-role-primary/10">
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                Faculty Workspace
              </span>
              <h2 className="text-2xl font-extrabold mt-3 tracking-tight">Good Morning, Professor {user?.name || 'John'} 👋</h2>
              <p className="text-white/80 text-xs mt-1">
                Department of Computer Science • Academic Session: AY 2026-27
              </p>
            </div>
            <div className="bg-white/12 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right text-xs">
              <div>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="opacity-80 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            </div>
          </div>
        </div>

        {/* Quick Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((item, idx) => (
            <Card key={idx} className="border-role-border/50 hover:border-role-primary/50 hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.title}</span>
                <span className={`text-xl font-extrabold text-slate-800 dark:text-white`}>{item.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Courses & Student List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Courses List */}
            <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <p className="text-xs text-slate-500">Active courses you are instructing this semester</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coursesTaught.map((course, idx) => (
                <div key={idx} className="p-4 border border-role-border/50 rounded-xl bg-role-surface/20 hover:bg-role-card-bg hover:shadow-sm transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-role-primary bg-role-surface border border-role-border px-2.5 py-0.5 rounded-full uppercase">
                      {course.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {course.timing}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mt-3">{course.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-4">
                    <User className="h-3.5 w-3.5" />
                    <span>{course.studentsCount} enrolled students</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Students Grade Directory */}
          <Card>
            <CardHeader>
              <CardTitle>Class Roster & Academic Status</CardTitle>
              <p className="text-xs text-slate-500">Student status directory for active grading</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">Student Name</th>
                      <th className="pb-3">Roll Number</th>
                      <th className="pb-3">Course</th>
                      <th className="pb-3 text-center">Marks</th>
                      <th className="pb-3 text-right pr-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="py-3.5 pl-2 font-semibold text-slate-880">{student.name}</td>
                        <td className="py-3.5 text-slate-500 text-xs">{student.rollNo}</td>
                        <td className="py-3.5 text-slate-500 text-xs">{student.course}</td>
                        <td className="py-3.5 text-center font-medium text-slate-700">{student.marks}/100</td>
                        <td className="py-3.5 text-right pr-2">
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                            student.grade.startsWith('A') 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {student.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Update Grades Panel */}
        <div className="space-y-6">
          <Card className="border-role-border/50 shadow-lg shadow-role-primary/5">
            <CardHeader>
              <CardTitle className="text-slate-900">Update Student Grade</CardTitle>
              <p className="text-xs text-slate-500">Review and enter academic records</p>
            </CardHeader>
            <CardContent>
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateGrade} className="space-y-4">
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Select Student
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      const std = students.find(s => s.id === e.target.value);
                      if (std) setMarks(std.marks);
                    }}
                    className="w-full h-11 rounded-xl border border-role-border bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-role-primary focus:ring-offset-2 transition-all duration-200"
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.rollNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Course</div>
                  <div className="text-xs font-semibold text-slate-700">{selectedStudent?.course}</div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Marks Obtained (0-100)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value) || 0)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-role-primary hover:bg-role-secondary focus:ring-role-primary text-sm shadow-md shadow-role-primary/10"
                >
                  Save Record
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Task Center Checklist Panel */}
          <Card className="border-amber-100/70 dark:border-amber-900/30 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-slate-900 dark:text-white">My Tasks</CardTitle>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900">
                  {pendingTasks.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500">Tasks assigned by the admin</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isTasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                </div>
              ) : assignedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No tasks assigned yet</p>
                </div>
              ) : (
                <>
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3.5 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/60 dark:border-amber-900/30 rounded-xl hover:bg-amber-50/70 dark:hover:bg-amber-950/20 transition-colors cursor-pointer group"
                      onClick={() => handleToggleTask(task)}
                    >
                      <div className="h-5 w-5 rounded-full border-2 border-amber-300 dark:border-amber-700 group-hover:border-emerald-400 transition-colors shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{task.title}</span>
                        {task.description && (
                          <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">{task.description}</span>
                        )}
                        <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1 mt-1.5">
                          <Clock className="h-3 w-3" />
                          Due {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/60 dark:border-slate-800/40 rounded-xl opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleToggleTask(task)}
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-500 line-through block">{task.title}</span>
                        <span className="text-[10px] text-slate-400">Completed</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </DashboardLayout>
);
}
