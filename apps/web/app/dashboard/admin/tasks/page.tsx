'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Button, Input } from '@campus-connect/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@campus-connect/ui';
import { Modal } from '../../../../components/Modal';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  X,
  Target,
  TrendingUp,
  ListTodo,
  Info,
} from 'lucide-react';
import { api, TaskRecord } from '../../../../utils/api';

// Mock teacher list for assignment dropdown
const MOCK_TEACHERS = [
  { id: 'usr-teacher-1', name: 'Prof. Amit Patil', email: 'amit.patil@collegec.edu' },
  { id: 'usr-teacher-2', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@collegec.edu' },
  { id: 'usr-teacher-3', name: 'Prof. Neha Sharma', email: 'neha.sharma@collegec.edu' },
  { id: 'usr-teacher-4', name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@collegec.edu' },
];

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, completed: 0, pending: 0 });
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Task Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formTeacherId, setFormTeacherId] = useState(MOCK_TEACHERS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const resp = await api.getTasks();
      setTasks(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const s = await api.getTasksSummary();
      setSummary(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSummary();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDueDate) return;
    setIsSubmitting(true);

    try {
      const teacher = MOCK_TEACHERS.find(t => t.id === formTeacherId);
      await api.createTask({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        dueDate: new Date(formDueDate).toISOString(),
        assignedToId: formTeacherId,
        assignedToName: teacher?.name,
      });

      setAlertMsg({ type: 'success', text: `Task "${formTitle}" assigned to ${teacher?.name} successfully!` });
      setIsCreateOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormDueDate('');
      fetchTasks();
      fetchSummary();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to create task.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: TaskRecord) => {
    const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      await api.updateTaskStatus(task.id, newStatus);
      setAlertMsg({ type: 'success', text: `Task "${task.title}" marked as ${newStatus.toLowerCase()}.` });
      fetchTasks();
      fetchSummary();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to update task status.' });
    }
  };

  const handleDeleteTask = async (task: TaskRecord) => {
    try {
      await api.deleteTask(task.id);
      setAlertMsg({ type: 'success', text: `Task "${task.title}" deleted.` });
      fetchTasks();
      fetchSummary();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Failed to delete task.' });
    }
  };

  const filteredTasks = tasks.filter(t => statusFilter === 'ALL' || t.status === statusFilter);
  const completionRate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) { return iso; }
  };

  const isDueSoon = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // within 24h
  };

  const isOverdue = (iso: string) => {
    return new Date(iso).getTime() < Date.now();
  };

  return (
    <DashboardLayout title="Task Center" icon={<ClipboardCheck className="h-6 w-6" />}>
      <div className="space-y-6">

        {/* Alert */}
        {alertMsg && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
              : 'bg-red-50/60 border-red-100 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {alertMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-xs font-semibold">{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)}><X className="h-4 w-4 opacity-50 hover:opacity-100" /></button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="hover:shadow-sm transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total Tasks</span>
                <span className="text-3xl font-extrabold text-slate-950 dark:text-white block">{summary.total}</span>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Completed</span>
                <span className="text-3xl font-extrabold text-emerald-600 block">{summary.completed}</span>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Completion Rate</span>
                <span className="text-3xl font-extrabold text-slate-950 dark:text-white block">{completionRate}%</span>
              </div>
              <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-850">
            {(['ALL', 'PENDING', 'COMPLETED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 h-8 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All Tasks' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Assign New Task</span>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Task Directory Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No tasks found</p>
                <p className="text-xs text-slate-400 mt-1">Create a new task to assign operations to faculty.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 pl-6">Status</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="pl-6">
                          <button onClick={() => handleToggleStatus(task)}>
                            {task.status === 'COMPLETED' ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-400 transition-colors" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className={`text-sm font-semibold block ${
                              task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {task.title}
                            </span>
                            {task.description && (
                              <span className="text-[11px] text-slate-400 leading-relaxed line-clamp-1 block mt-0.5">{task.description}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                              {task.assignedTo?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">{task.assignedTo?.name}</span>
                              <span className="text-[10px] text-slate-400">{task.assignedTo?.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : isOverdue(task.dueDate)
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                                : isDueSoon(task.dueDate)
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                  : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] text-slate-400">{formatDate(task.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors inline-flex"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* --------------- MODAL: CREATE TASK --------------- */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Assign New Task to Teacher"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-5">
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-4 rounded-2xl flex gap-3 text-blue-700 dark:text-blue-400">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              Assign an operational task to a teacher. They will see this in their Task Center dashboard and can mark it as completed.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Task Title</label>
              <Input
                placeholder="e.g. Upload DBMS Unit 2 Notes"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description (Optional)</label>
              <textarea
                placeholder="Add additional instructions for the teacher..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Assign To</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1"
                >
                  {MOCK_TEACHERS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Due Date</label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              variant="secondary"
              className="h-9.5 px-4.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9.5 px-4.5 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-slate-100 text-xs font-bold"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  );
}
