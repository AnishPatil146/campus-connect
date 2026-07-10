'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Megaphone, Plus, Eye, Pencil, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../../../utils/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  target: string;
  status: string;
  priority: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  author?: { id: string; name: string; email: string };
}

type ModalMode = 'create' | 'edit' | 'view' | null;

const CATEGORIES = ['Notice', 'Result', 'Holiday', 'Warning', 'Exam', 'General'] as const;
const STATUSES = ['PUBLISHED', 'SCHEDULED', 'DRAFT'] as const;
const PRIORITIES = ['HIGH', 'NORMAL', 'LOW'] as const;

export default function AnnouncementCenter() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<string>('General');
  const [formTarget, setFormTarget] = useState('Entire College');
  const [formStatus, setFormStatus] = useState<string>('DRAFT');
  const [formPriority, setFormPriority] = useState<string>('NORMAL');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
    return;
  }, [toast]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const result = await api.getAnnouncements();
    if (result.success) {
      setAnnouncements(result.data);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('General');
    setFormTarget('Entire College');
    setFormStatus('DRAFT');
    setFormPriority('NORMAL');
    setFormScheduledAt('');
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedAnnouncement(null);
    setModalMode('create');
  };

  const openEditModal = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);
    setFormTarget(ann.target);
    setFormStatus(ann.status);
    setFormPriority(ann.priority);
    setFormScheduledAt(ann.scheduledAt ? ann.scheduledAt.slice(0, 16) : '');
    setModalMode('edit');
  };

  const openViewModal = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setModalMode('view');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAnnouncement(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setToast({ type: 'error', text: 'Title and content are required.' });
      return;
    }

    setIsSaving(true);

    const payload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      target: formTarget,
      status: formStatus,
      priority: formPriority,
      scheduledAt: formScheduledAt || undefined,
    };

    let result;
    if (modalMode === 'create') {
      result = await api.createAnnouncement(payload);
    } else if (modalMode === 'edit' && selectedAnnouncement) {
      result = await api.updateAnnouncement(selectedAnnouncement.id, payload);
    }

    setIsSaving(false);

    if (result?.success) {
      setToast({ type: 'success', text: modalMode === 'create' ? 'Announcement created successfully!' : 'Announcement updated successfully!' });
      closeModal();
      fetchAnnouncements();
    } else {
      setToast({ type: 'error', text: result?.message || 'Operation failed. Please try again.' });
    }
  };

  const handleDelete = async (ann: Announcement) => {
    if (!confirm(`Delete "${ann.title}"? This cannot be undone.`)) return;

    const result = await api.deleteAnnouncement(ann.id);
    if (result.success) {
      setToast({ type: 'success', text: 'Announcement deleted.' });
      fetchAnnouncements();
    } else {
      setToast({ type: 'error', text: result.message || 'Failed to delete.' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getCategoryVariant = (category: string): 'success' | 'warning' | 'danger' | 'secondary' => {
    switch (category) {
      case 'Holiday': return 'success';
      case 'Exam': return 'warning';
      case 'Warning': return 'danger';
      case 'Result': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'secondary' => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'SCHEDULED': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout title="Announcement Center" icon={<Megaphone className="h-6 w-6" />}>
      <div className="space-y-6">

        {/* Toast notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] p-4 rounded-xl border shadow-lg flex items-center gap-3 text-sm font-medium animate-in slide-in-from-right duration-300 max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/80 dark:border-red-800 dark:text-red-300'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-auto hover:opacity-70 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top actions panel */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Announcement & Notification Engine</h4>
            <p className="text-xs text-slate-400 mt-0.5">Broadcast important circulars, warnings, and result notices to target groups.</p>
          </div>
          
          <Button
            onClick={openCreateModal}
            className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Publish Announcement</span>
          </Button>
        </Card>

        {/* Announcements list */}
        <Card>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-slate-300 border-t-blue-600 rounded-full mx-auto" />
              <p className="text-xs text-slate-400 mt-3">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400">No announcements yet</h4>
              <p className="text-xs text-slate-400 mt-1">Click "Publish Announcement" to create your first one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Announcement Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target Group</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell>
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{ann.title}</p>
                        <p className="text-xs text-slate-400 truncate">By {ann.author?.name || 'Admin'} · {ann.priority} priority</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryVariant(ann.category)} className="text-[10px] px-2 py-0.5">
                        {ann.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">{ann.target}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {ann.status === 'SCHEDULED' ? `Scheduled: ${formatDate(ann.scheduledAt)}` : formatDate(ann.publishedAt || ann.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ann.status)} className="text-[10px]">
                        {ann.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs rounded-lg inline-flex items-center gap-1 cursor-pointer"
                          title="View details"
                          onClick={() => openViewModal(ann)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs rounded-lg inline-flex items-center gap-1 cursor-pointer"
                          title="Edit"
                          onClick={() => openEditModal(ann)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs rounded-lg inline-flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Delete"
                          onClick={() => handleDelete(ann)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Modal Overlay */}
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {modalMode === 'create' ? 'New Announcement' : modalMode === 'edit' ? 'Edit Announcement' : 'Announcement Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {modalMode === 'view' && selectedAnnouncement ? (
                  /* VIEW MODE */
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedAnnouncement.title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Content</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                        <Badge variant={getCategoryVariant(selectedAnnouncement.category)} className="text-[10px]">{selectedAnnouncement.category}</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                        <Badge variant={getStatusVariant(selectedAnnouncement.status)} className="text-[10px]">{selectedAnnouncement.status}</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedAnnouncement.target}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedAnnouncement.priority}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Author</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedAnnouncement.author?.name || 'Admin'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(selectedAnnouncement.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CREATE / EDIT MODE */
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Title</label>
                      <input
                        type="text"
                        placeholder="Announcement title..."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Content</label>
                      <textarea
                        placeholder="Write the full announcement text..."
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        rows={4}
                        className="flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-medium resize-none"
                      />
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Category</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Priority</label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Target & Status */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Target Group</label>
                        <select
                          value={formTarget}
                          onChange={(e) => setFormTarget(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Entire College">Entire College</option>
                          <option value="BSc IT">BSc IT</option>
                          <option value="BSc IT Semester 1">BSc IT Semester 1</option>
                          <option value="BSc IT Semester 3">BSc IT Semester 3</option>
                          <option value="BSc CS">BSc CS</option>
                          <option value="BMS">BMS</option>
                          <option value="BCom">BCom</option>
                          <option value="Teachers Only">Teachers Only</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Scheduled At (only when status is SCHEDULED) */}
                    {formStatus === 'SCHEDULED' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Schedule Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formScheduledAt}
                          onChange={(e) => setFormScheduledAt(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  onClick={closeModal}
                  className="h-10 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </Button>
                {modalMode !== 'view' && (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create Announcement' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
