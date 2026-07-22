'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Badge, Modal, Input } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { useSocket } from '../../../../components/SocketProvider';
import { useLoading } from '../../../../components/LoadingProvider';
import { api } from '../../../../utils/api';
import { 
  Folder, 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Video, 
  Link as LinkIcon, 
  Calendar,
  UploadCloud,
  ChevronRight,
  BookOpen,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  subject: string;
  semester: number;
  teacher: string;
  uploadDate: string;
  fileSize: string;
  downloadCount: number;
  pdfUrl: string;
  videoUrl?: string;
  referenceLinks?: { name: string; url: string }[];
  assignments?: { title: string; dueDate: string }[];
  createdAt: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startLoading, stopLoading } = useLoading();
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  
  // Navigation states
  const [currentFolderView, setCurrentFolderView] = useState<'semesters' | 'subjects' | 'notes'>('semesters');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Modal states for preview & upload
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form states for note upload/edit
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('');
  const [newNoteSemester, setNewNoteSemester] = useState(1);
  const [newNoteTeacher, setNewNoteTeacher] = useState('');
  const [newNoteSize, setNewNoteSize] = useState('2.5 MB');
  const [newNoteVideo, setNewNoteVideo] = useState('');
  const [newNoteRefName, setNewNoteRefName] = useState('');
  const [newNoteRefUrl, setNewNoteRefUrl] = useState('');
  const [newNoteAssignTitle, setNewNoteAssignTitle] = useState('');
  const [newNoteAssignDate, setNewNoteAssignDate] = useState('');

  // Role details
  const isTeacher = user?.role === 'TEACHER';
  const subjectsTaught = useMemo(() => (user?.teacherProfile as any)?.subjects || [], [user]);

  // Set default subject and teacher name for upload form
  useEffect(() => {
    if (user) {
      setNewNoteTeacher(user.name || '');
      if (subjectsTaught.length > 0) {
        setNewNoteSubject(subjectsTaught[0].subject?.name || '');
      }
    }
  }, [user, subjectsTaught]);

  // Folders organization
  const semesters = [1, 2, 3, 4];
  const subjectsBySem: Record<number, string[]> = {
    1: ['Database Management Systems', 'Operating Systems', 'Python Web Lab', 'Discrete Mathematics'],
    2: ['Data Structures', 'Web Technologies', 'Software Engineering', 'Microprocessors'],
    3: ['Computer Networks', 'Design Analysis Algorithms', 'Cloud Computing', 'Embedded Systems'],
    4: ['Artificial Intelligence', 'Cyber Security', 'DevOps Systems', 'Machine Learning']
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isTeacher ? await api.getNotes() : await api.getStudentNotes();
      if (res.success && res.data) {
        setNotesList(res.data);
      } else {
        setError((res as any).message || 'Failed to load study notes.');
      }
    } catch (e) {
      setError('A connection issue occurred while fetching notes.');
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket) return;
    const handleNoteUploaded = (newNote: any) => {
      console.log('Socket event: Note uploaded -> refreshing state', newNote);
      loadNotes();
    };
    socket.on('noteUploaded', handleNoteUploaded);
    return () => {
      socket.off('noteUploaded', handleNoteUploaded);
    };
  }, [socket, loadNotes]);

  if (loading) {
    return (
      <DashboardLayout title="Study Resource Hub" icon={<BookOpen className="h-6 w-6" />}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading study materials...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Study Resource Hub" icon={<BookOpen className="h-6 w-6" />}>
        <div className="p-6 bg-red-50/60 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-2xl text-center space-y-4 max-w-md mx-auto mt-12">
          <AlertCircle className="h-10 w-10 text-red-550 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Connection Error</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button 
            onClick={loadNotes}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </DashboardLayout>
    );
  }



  // Handle Note Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const sizeInBytes = parseFloat(newNoteSize) ? Math.round(parseFloat(newNoteSize) * 1024 * 1024) : 1024 * 1024 * 2.5;

    const payload = {
      title: newNoteTitle,
      subject: newNoteSubject,
      semester: newNoteSemester,
      teacher: newNoteTeacher,
      fileSize: sizeInBytes,
      fileName: `${newNoteTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      fileUrl: '/files/mock-pdf.pdf',
      videoUrl: newNoteVideo || undefined,
      status: 'PUBLISHED',
      category: 'Study Materials',
      referenceLinks: newNoteRefName ? [{ name: newNoteRefName, url: newNoteRefUrl || 'https://google.com' }] : undefined,
      assignments: newNoteAssignTitle ? [{ title: newNoteAssignTitle, dueDate: newNoteAssignDate || new Date().toISOString() }] : undefined,
    };

    startLoading("Uploading notes...");
    try {
      const res = await api.uploadTeacherNote(payload);

      if (res.success) {
        // Reset and close
        setNewNoteTitle('');
        setNewNoteVideo('');
        setNewNoteRefName('');
        setNewNoteRefUrl('');
        setNewNoteAssignTitle('');
        setNewNoteAssignDate('');
        setIsUploadOpen(false);
        loadNotes();

        // Emit WS event
        if (socket) {
          socket.emit('noteUploaded', res.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopLoading();
    }
  };

  // Handle Edit Note Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !newNoteTitle.trim()) return;

    const payload = {
      title: newNoteTitle,
      subject: newNoteSubject,
      semester: newNoteSemester,
      videoUrl: newNoteVideo || null,
    };

    startLoading("Saving changes...");
    try {
      const res = await api.updateNote(editingNote.id, payload);
      if (res.success) {
        setEditingNote(null);
        loadNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopLoading();
    }
  };

  // Populate Edit Modal
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteSubject(note.subject);
    setNewNoteSemester(note.semester);
    setNewNoteVideo(note.videoUrl || '');
  };

  // Handle Delete Note
  const handleDeleteNote = async (id: string) => {
    if (confirm('Are you sure you want to delete this notes document?')) {
      startLoading("Deleting notes...");
      try {
        const res = await api.deleteNote(id);
        if (res.success) {
          loadNotes();
        }
      } catch (err) {
        console.error(err);
      } finally {
        stopLoading();
      }
    }
  };

  const handleDownload = async (note: Note) => {
    // Record download count
    await api.recordDownload(note.id);
    loadNotes();

    // Trigger local client download
    const link = document.createElement('a');
    link.href = note.pdfUrl || '/files/mock-pdf.pdf';
    link.setAttribute('download', note.pdfUrl.split('/').pop() || `${note.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper matching subject names loosely
  const isSubjectMatch = (noteSub: string, folderSub: string) => {
    const cleanNote = noteSub.toLowerCase().replace(/\s+|s$/g, '');
    const cleanFolder = folderSub.toLowerCase().replace(/\s+|s$/g, '');
    return cleanNote.includes(cleanFolder) || cleanFolder.includes(cleanNote);
  };

  // Filter logic
  const filteredNotes = notesList.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = semesterFilter === 'all' || note.semester === Number(semesterFilter);
    const matchesSubject = subjectFilter === 'all' || isSubjectMatch(note.subject, subjectFilter);
    
    // If browsing folders, narrow down matching notes
    if (selectedSemester !== null && selectedSubject === null) {
      return note.semester === selectedSemester && matchesSearch;
    }
    if (selectedSemester !== null && selectedSubject !== null) {
      return note.semester === selectedSemester && isSubjectMatch(note.subject, selectedSubject) && matchesSearch;
    }

    return matchesSearch && matchesSemester && matchesSubject;
  });

  // Dynamic Theme Colors based on Role
  const btnColorClass = isTeacher 
    ? 'bg-emerald-650 hover:bg-emerald-700 text-white shadow-emerald-500/10' 
    : 'bg-blue-650 hover:bg-blue-700 text-white shadow-blue-500/10';

  const hoverBorderClass = isTeacher 
    ? 'hover:border-emerald-500/50 hover:text-emerald-500' 
    : 'hover:border-blue-500/50 hover:text-blue-500';

  const focusRingClass = isTeacher ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';
  const textAccentClass = isTeacher ? 'text-emerald-600' : 'text-blue-600';
  const bgAccentClass = isTeacher ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 border border-blue-100/30';
  const hoverTextClass = isTeacher ? 'hover:text-emerald-600' : 'hover:text-blue-650';

  return (
    <DashboardLayout title="Study Notes Hub" icon={<BookOpen className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {/* Top bar controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-900">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 ${focusRingClass}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentFolderView === 'semesters' && (
              <>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className={`px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs focus:outline-none focus:ring-2 ${focusRingClass}`}
                >
                  <option value="all">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                </select>

                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className={`px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs focus:outline-none focus:ring-2 ${focusRingClass}`}
                >
                  <option value="all">All Subjects</option>
                  <option value="Database Management Systems">DBMS</option>
                  <option value="Operating Systems">OS</option>
                  <option value="Python Web Lab">Python</option>
                  <option value="Discrete Mathematics">Discrete Maths</option>
                </select>
              </>
            )}

            {isTeacher && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-xs rounded-xl shadow-md active:scale-[0.98] transition-all ${btnColorClass}`}
              >
                <UploadCloud className="h-4 w-4" />
                Upload Notes
              </button>
            )}
          </div>
        </div>

        {/* Folder Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button 
            onClick={() => {
              setCurrentFolderView('semesters');
              setSelectedSemester(null);
              setSelectedSubject(null);
            }} 
            className={hoverTextClass}
          >
            Study Hub
          </button>
          
          {selectedSemester && (
            <>
              <ChevronRight className="h-3 w-3" />
              <button 
                onClick={() => {
                  setCurrentFolderView('subjects');
                  setSelectedSubject(null);
                }} 
                className={hoverTextClass}
              >
                Semester {selectedSemester}
              </button>
            </>
          )}

          {selectedSubject && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-850 dark:text-slate-200">{selectedSubject}</span>
            </>
          )}
        </div>

        {/* Dynamic Navigation Content */}
        {currentFolderView === 'semesters' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  setSelectedSemester(sem);
                  setCurrentFolderView('subjects');
                }}
                className={`group p-5 rounded-2xl border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 flex items-center gap-4 hover:-translate-y-0.5 transition-all text-left shadow-sm hover:shadow-md ${hoverBorderClass}`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${bgAccentClass}`}>
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Semester {sem}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Directory Folders</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {currentFolderView === 'subjects' && selectedSemester !== null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjectsBySem[selectedSemester].map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  setCurrentFolderView('notes');
                }}
                className={`group p-5 rounded-2xl border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950 flex items-center justify-between hover:-translate-y-0.5 transition-all text-left shadow-sm hover:shadow-md ${hoverBorderClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${bgAccentClass}`}>
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1">{sub}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Resource Folder</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {/* Notes list */}
        {(currentFolderView === 'notes' || searchTerm.trim() !== '') && (
          <div className="space-y-4">
            {filteredNotes.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5">
                <AlertCircle className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No notes uploaded.</h4>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="border-slate-150 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                  <div className="p-5 flex flex-col lg:flex-row justify-between gap-5">
                    
                    {/* Info */}
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${bgAccentClass}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{note.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-450 mt-2 font-semibold">
                          <span>Subject: <strong className="text-slate-650 dark:text-slate-350">{note.subject}</strong></span>
                          <span>Uploaded: <strong>{note.uploadDate}</strong></span>
                          <span>Size: <strong>{note.fileSize}</strong></span>
                          <span>Teacher: <strong>{note.teacher}</strong></span>
                          <span>Downloads: <strong className={textAccentClass}>{note.downloadCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 lg:self-center shrink-0">
                      {isTeacher && (
                        <>
                          <button
                            onClick={() => openEditModal(note)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-transparent bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-semibold text-xs rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setPreviewNote(note)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(note)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm ${
                          isTeacher ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>

                  </div>

                  {/* Learning Hub Extras */}
                  {(note.videoUrl || note.referenceLinks || note.assignments) && (
                    <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Video Link */}
                      {note.videoUrl ? (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Video className="h-4.5 w-4.5 text-red-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-705 dark:text-slate-305 block">Watch Lecture</span>
                            <a 
                              href={note.videoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={`text-[10px] hover:underline truncate block ${textAccentClass}`}
                            >
                              Class Recorded Session
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* References */}
                      {note.referenceLinks && note.referenceLinks.length > 0 ? (
                        <div className="flex items-center gap-2.5 text-xs">
                          <LinkIcon className={`h-4.5 w-4.5 shrink-0 ${textAccentClass}`} />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-705 dark:text-slate-305 block">Practice Questions</span>
                            <a 
                              href={note.referenceLinks[0].url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={`text-[10px] hover:underline truncate block ${textAccentClass}`}
                            >
                              {note.referenceLinks[0].name}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Assignment */}
                      {note.assignments && note.assignments.length > 0 ? (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Calendar className={`h-4.5 w-4.5 shrink-0 ${textAccentClass}`} />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-750 dark:text-slate-305 block">Assignment Due</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                              {note.assignments[0].title} (Due: {new Date(note.assignments[0].dueDate || note.assignments[0].dueDate).toLocaleDateString()})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                    </div>
                  )}

                </Card>
              ))
            )}
          </div>
        )}

        {/* Browser PDF Preview Modal */}
        <Modal
          isOpen={previewNote !== null}
          onClose={() => setPreviewNote(null)}
          title={previewNote?.title || 'PDF Preview'}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] text-slate-400 font-semibold">Downloads: {previewNote?.downloadCount || 0}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewNote(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Close Preview
                </button>
                {previewNote && (
                  <button
                    onClick={() => {
                      handleDownload(previewNote);
                      setPreviewNote(null);
                    }}
                    className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-sm ${
                      isTeacher ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          }
        >
          {previewNote && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{previewNote.subject}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Uploaded by: {previewNote.teacher} • Size: {previewNote.fileSize}</p>
                </div>
                <Badge variant="primary" className="text-[10px] font-bold">PDF Resource</Badge>
              </div>

              <div className="border border-slate-150 dark:border-slate-850 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-6 font-mono text-xs text-slate-700 dark:text-slate-350 min-h-[250px] flex flex-col justify-between">
                <div>
                  <p className="text-center font-bold text-slate-450 uppercase tracking-widest text-[9px] mb-4">--- [ PDF VIEWPORT PREVIEW ] ---</p>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">CAMPUS CONNECT ONLINE RESOURCE REGISTRY</p>
                  <p className="mb-2">Course Module: {previewNote.subject} (Sem {previewNote.semester})</p>
                  <p className="mb-4">Title: {previewNote.title}</p>
                  <p className="leading-relaxed font-sans text-xs">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vel metus at erat scelerisque scelerisque. 
                    Donec tincidunt risus diam, at tincidunt nisi vestibulum at. Suspendisse non sapien vel est iaculis bibendum. 
                    Nunc non elementum augue. Proin ut elit et magna gravida eleifend vel a felis.
                  </p>
                </div>
                <p className="text-center text-[8px] text-slate-400 mt-6">Page 1 of 12 • Campus Connect PDF Reader</p>
              </div>
            </div>
          )}
        </Modal>

        {/* Teacher Upload Modal */}
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Upload Study Notes (Teacher Mode)"
          size="md"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <Input
              label="Document Title"
              placeholder="e.g. Unit 3 Notes: Database Constraints"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 select-none">Subject</label>
                <select
                  value={newNoteSubject}
                  onChange={(e) => setNewNoteSubject(e.target.value)}
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus:ring-2 ${focusRingClass}`}
                >
                  {subjectsTaught.length > 0 ? (
                    subjectsTaught.map((item: any, idx: number) => (
                      <option key={idx} value={item.subject?.name}>
                        {item.subject?.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Database Management Systems">Database Management Systems</option>
                      <option value="Operating Systems">Operating Systems</option>
                      <option value="Python Web Lab">Python Web Lab</option>
                      <option value="Discrete Mathematics">Discrete Mathematics</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 select-none">Semester</label>
                <select
                  value={newNoteSemester}
                  onChange={(e) => setNewNoteSemester(Number(e.target.value))}
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus:ring-2 ${focusRingClass}`}
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                  <option value={3}>Semester 3</option>
                  <option value={4}>Semester 4</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Faculty Name"
                value={newNoteTeacher}
                onChange={(e) => setNewNoteTeacher(e.target.value)}
                required
                disabled
              />
              <Input
                label="File Size"
                value={newNoteSize}
                onChange={(e) => setNewNoteSize(e.target.value)}
                required
              />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-900 my-4 pt-4" />
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider mb-2">⭐ Learning Hub Components (Optional)</h5>

            <Input
              label="Video Lecture Link (YouTube or Recorded URL)"
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              value={newNoteVideo}
              onChange={(e) => setNewNoteVideo(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Reference Resource Name"
                placeholder="e.g. Practice Questions"
                value={newNoteRefName}
                onChange={(e) => setNewNoteRefName(e.target.value)}
              />
              <Input
                label="Reference URL"
                placeholder="e.g. https://geeksforgeeks.org/..."
                value={newNoteRefUrl}
                onChange={(e) => setNewNoteRefUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Assignment Title"
                placeholder="e.g. DBMS Normalization Assignment"
                value={newNoteAssignTitle}
                onChange={(e) => setNewNoteAssignTitle(e.target.value)}
              />
              <Input
                label="Assignment Due Date"
                type="date"
                value={newNoteAssignDate}
                onChange={(e) => setNewNoteAssignDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 border border-slate-205 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-sm ${isTeacher ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Confirm Upload
              </button>
            </div>
          </form>
        </Modal>

        {/* Teacher Edit Modal */}
        <Modal
          isOpen={editingNote !== null}
          onClose={() => setEditingNote(null)}
          title="Edit Notes Document"
          size="md"
        >
          {editingNote && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input
                label="Document Title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-705 select-none">Subject</label>
                  <select
                    value={newNoteSubject}
                    onChange={(e) => setNewNoteSubject(e.target.value)}
                    className={`flex h-11 w-full rounded-xl border border-slate-202 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus:ring-2 ${focusRingClass}`}
                  >
                    {subjectsTaught.map((item: any, idx: number) => (
                      <option key={idx} value={item.subject?.name}>
                        {item.subject?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-705 select-none">Semester</label>
                  <select
                    value={newNoteSemester}
                    onChange={(e) => setNewNoteSemester(Number(e.target.value))}
                    className={`flex h-11 w-full rounded-xl border border-slate-202 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus:ring-2 ${focusRingClass}`}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                    <option value={3}>Semester 3</option>
                    <option value={4}>Semester 4</option>
                  </select>
                </div>
              </div>

              <Input
                label="Video Lecture Link (Optional)"
                value={newNoteVideo}
                onChange={(e) => setNewNoteVideo(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 border border-slate-205 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-sm ${isTeacher ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}
