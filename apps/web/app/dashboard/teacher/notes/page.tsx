'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { useLoading } from '../../../../components/LoadingProvider';
import { api } from '../../../../utils/api';
import { BookOpen, Plus, FileText, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TeacherNotesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startLoading, stopLoading } = useLoading();

  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal visibility
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [visibility, setVisibility] = useState<'SEMESTER' | 'CLASS' | 'PUBLIC'>('SEMESTER');
  const [documentUrl, setDocumentUrl] = useState('/files/mock-pdf.pdf');
  const [fileName, setFileName] = useState('lecture-notes.pdf');

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subjectsTaught = (user?.teacherProfile as any)?.subjects || [];
  const activeSubject = subjectsTaught[selectedSubjectIdx];

  const fetchNotes = async () => {
    if (!user?.teacherProfile?.id) return;
    setIsLoading(true);
    try {
      const res = await api.getNotes({ teacherId: user.teacherProfile.id });
      if (res.success && res.data) {
        setNotes(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  // Handle Note Deletion
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    startLoading('Deleting notes...');
    try {
      const res = await api.deleteNote(noteId);
      if (res.success) {
        setSuccessMsg('Note deleted successfully.');
        fetchNotes();
      } else {
        setErrorMsg('Failed to delete note.');
      }
    } catch (e) {
      setErrorMsg('Error deleting note.');
    } finally {
      stopLoading();
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  // Handle Note Upload
  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeSubject || !user?.teacherProfile?.id) return;

    startLoading('Uploading note...');
    try {
      const payload = {
        title,
        description,
        category: 'Study Materials',
        subject: activeSubject.subject?.name || 'Database Management Systems',
        semester: activeSubject.subject?.semesterId || 'Semester 1',
        division: activeSubject.division?.name || 'Division A',
        fileUrl: documentUrl || '/files/mock-pdf.pdf',
        fileName: fileName || 'lecture-notes.pdf',
        fileSize: 1024 * 1024 * 2.5, // Mock size 2.5MB
        mimeType: 'application/pdf',
        visibility,
        status: 'PUBLISHED',
      };

      const res = await api.uploadTeacherNote(payload);
      if (res.success && res.data) {
        setSuccessMsg(`Note "${title}" uploaded successfully!`);
        setTitle('');
        setDescription('');
        setShowUploadModal(false);
        fetchNotes();

        // Emit socket notification
        if (socket) {
          socket.emit('noteUploaded', res.data);
        }
      } else {
        setErrorMsg('Failed to upload note.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading note.');
    } finally {
      stopLoading();
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  const totalDownloads = notes.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);

  return (
    <DashboardLayout title="Notes & Learning Hub" icon={<BookOpen className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {/* Alerts */}
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

        {/* Top Header Card */}
        <div className="relative rounded-2xl p-6 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lecture Notes & Documents Registry</h3>
            <p className="text-xs text-slate-500 mt-1">Upload and manage learning resources shared with students.</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="h-10 px-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            Upload Study Material
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Total Uploads
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {notes.length} Files
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Total Downloads
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {totalDownloads} Hits
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Assigned Subjects
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {subjectsTaught.length} Lectures
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Notes Listing */}
        <Card className="border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle>My Uploaded Study Material</CardTitle>
            <p className="text-xs text-slate-500">List of documents currently published on the student workspace</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/5">
                <FileText className="h-10 w-10 text-slate-350 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 font-bold">No documents uploaded yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click "Upload Study Material" above to share lecture notes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 pl-2">Title</th>
                      <th className="pb-3">Subject</th>
                      <th className="pb-3">Division</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-center">Visibility</th>
                      <th className="pb-3 text-center">Downloads</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <tr key={note.id} className="border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate">{note.title}</div>
                          {note.description && (
                            <div className="text-[10px] text-slate-400 max-w-[200px] truncate mt-0.5">{note.description}</div>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-500 font-medium">{note.subject}</td>
                        <td className="py-3.5 text-slate-500 font-medium">Division {note.division || 'A'}</td>
                        <td className="py-3.5 text-slate-450">{note.uploadDate}</td>
                        <td className="py-3.5 text-center">
                          <Badge variant="success" className="text-[9px] border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                            {note.visibility}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          {note.downloadCount || 0}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-slate-400 hover:text-red-655 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Notes Modal */}
        {showUploadModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowUploadModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Upload Study Material</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Publish lecture notes directly to academic databases</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleUploadNote} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 3 - Indexing & Hashing Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Description / Syllabus Scope
                  </label>
                  <textarea
                    placeholder="Provide keywords or summary of content..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 min-h-[70px] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Subject / Lecture Target
                    </label>
                    <select
                      value={selectedSubjectIdx}
                      onChange={(e) => setSelectedSubjectIdx(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {subjectsTaught.map((item: any, idx: number) => (
                        <option key={idx} value={idx}>
                          {item.subject?.name} ({item.division?.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Visibility Scope
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="SEMESTER">Semester Wide</option>
                      <option value="CLASS">Class Division Only</option>
                      <option value="PUBLIC">Entire College</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Upload Study Material (PDF / Document)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,image/*,.doc,.docx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      startLoading('Uploading file...');
                      try {
                        const res = await api.uploadFile(file, 'notes');
                        if (res.success && res.data) {
                          setDocumentUrl(res.data.storagePath || res.data.fileUrl || '/files/mock-pdf.pdf');
                          setFileName(file.name);
                          setSuccessMsg('File uploaded to cloud storage successfully!');
                        } else {
                          setErrorMsg('Failed to upload file to cloud storage.');
                        }
                      } catch (err) {
                        setErrorMsg('Error uploading file.');
                      } finally {
                        stopLoading();
                        setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
                      }
                    }}
                    required={!documentUrl}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {fileName && (
                    <span className="text-[10px] font-semibold text-slate-400 block mt-1.5 truncate">
                      Selected: {fileName}
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 h-10 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-500/10 active:scale-[0.98] transition-all"
                  >
                    Publish Note
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
