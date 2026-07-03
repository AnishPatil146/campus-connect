'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Badge, Modal, Input } from '@campus-connect/ui';
import { useStudentData, Note } from '../../../../components/StudentDataProvider';
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
  ChevronRight
} from 'lucide-react';

export default function NotesPage() {
  const { notes, addNote, incrementDownload } = useStudentData();
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

  // Form states for mock upload
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('Python Programming');
  const [newNoteSemester, setNewNoteSemester] = useState(1);
  const [newNoteTeacher, setNewNoteTeacher] = useState('Prof. Amit Patil');
  const [newNoteSize, setNewNoteSize] = useState('2.5 MB');
  const [newNoteVideo, setNewNoteVideo] = useState('');
  const [newNoteRefName, setNewNoteRefName] = useState('');
  const [newNoteRefUrl, setNewNoteRefUrl] = useState('');
  const [newNoteAssignTitle, setNewNoteAssignTitle] = useState('');
  const [newNoteAssignDate, setNewNoteAssignDate] = useState('');

  // Folders organization
  const semesters = [1, 2, 3, 4];
  const subjectsBySem: Record<number, string[]> = {
    1: ['Database Management System', 'Operating System', 'Python Programming', 'Java Programming', 'Mathematics'],
    2: ['Data Structures', 'Web Technologies', 'Software Engineering', 'Microprocessors', 'Probability Stats'],
    3: ['Computer Networks', 'Design Analysis Algorithms', 'Cloud Computing', 'Embedded Systems', 'Economics'],
    4: ['Artificial Intelligence', 'Cyber Security', 'DevOps Systems', 'Mobile App Dev', 'Machine Learning']
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    // Handle reference links
    const referenceLinks = newNoteRefName && newNoteRefUrl 
      ? [{ name: newNoteRefName, url: newNoteRefUrl }] 
      : undefined;

    // Handle assignment
    const assignments = newNoteAssignTitle && newNoteAssignDate
      ? [{ title: newNoteAssignTitle, dueDate: newNoteAssignDate }]
      : undefined;

    addNote({
      title: newNoteTitle,
      subject: newNoteSubject,
      semester: Number(newNoteSemester),
      teacher: newNoteTeacher,
      fileSize: newNoteSize,
      pdfUrl: '/files/mock-pdf.pdf',
      videoUrl: newNoteVideo || undefined,
      referenceLinks,
      assignments
    });

    // Reset and close
    setNewNoteTitle('');
    setNewNoteVideo('');
    setNewNoteRefName('');
    setNewNoteRefUrl('');
    setNewNoteAssignTitle('');
    setNewNoteAssignDate('');
    setIsUploadOpen(false);
  };

  const handleDownload = (noteId: string) => {
    incrementDownload(noteId);
  };

  // Filter logic
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = semesterFilter === 'all' || note.semester === Number(semesterFilter);
    const matchesSubject = subjectFilter === 'all' || note.subject === subjectFilter;
    
    // If browsing folders, narrow down matching notes
    if (selectedSemester !== null && selectedSubject === null) {
      return note.semester === selectedSemester && matchesSearch;
    }
    if (selectedSemester !== null && selectedSubject !== null) {
      return note.semester === selectedSemester && note.subject === selectedSubject && matchesSearch;
    }

    return matchesSearch && matchesSemester && matchesSubject;
  });

  return (
    <DashboardLayout title="📚 Study Notes Hub">
      <div className="space-y-6">
        
        {/* Top bar controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentFolderView === 'semesters' && (
              <>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Subjects</option>
                  <option value="Database Management System">DBMS</option>
                  <option value="Operating System">OS</option>
                  <option value="Python Programming">Python</option>
                  <option value="Java Programming">Java</option>
                </select>
              </>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              <UploadCloud className="h-4 w-4" />
              Upload Notes
            </button>
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
            className="hover:text-blue-600"
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
                className="hover:text-blue-600"
              >
                Semester {selectedSemester}
              </button>
            </>
          )}

          {selectedSubject && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-800 dark:text-slate-200">{selectedSubject}</span>
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
                className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex items-center gap-4 hover:border-blue-200 hover:-translate-y-0.5 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 border border-amber-100/30 flex items-center justify-center shrink-0">
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Semester {sem}</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Directory Folders</p>
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
                className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex items-center justify-between hover:border-blue-200 hover:-translate-y-0.5 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center shrink-0">
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
                <FileText className="h-10 w-10 mx-auto text-slate-450 mb-3" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No notes found</h4>
                <p className="text-xs text-slate-450 mt-1">Try refining your search keyword or filters</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="border-slate-100 overflow-hidden bg-white dark:bg-slate-950">
                  <div className="p-5 flex flex-col lg:flex-row justify-between gap-5">
                    
                    {/* Info */}
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{note.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-450 mt-1.5 font-medium">
                          <span>Subject: <strong className="text-slate-650 dark:text-slate-350">{note.subject}</strong></span>
                          <span>Uploaded: <strong>{note.uploadDate}</strong></span>
                          <span>Size: <strong>{note.fileSize}</strong></span>
                          <span>Teacher: <strong>{note.teacher}</strong></span>
                          <span>Downloads: <strong className="text-blue-600">{note.downloadCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 lg:self-center shrink-0">
                      <button
                        onClick={() => setPreviewNote(note)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(note.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>

                  </div>

                  {/* Learning Hub Extras (Video, refs, assignments) */}
                  {(note.videoUrl || note.referenceLinks || note.assignments) && (
                    <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-50 dark:border-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Video Link */}
                      {note.videoUrl ? (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Video className="h-4.5 w-4.5 text-red-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Watch Lecture</span>
                            <a 
                              href={note.videoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-blue-600 hover:underline truncate block"
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
                          <LinkIcon className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Practice Questions</span>
                            <a 
                              href={note.referenceLinks[0].url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-blue-600 hover:underline truncate block"
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
                          <Calendar className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-750 dark:text-slate-300 block">Assignment Due</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                              {note.assignments[0].title} (Due: {note.assignments[0].dueDate})
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
              <span className="text-[10px] text-slate-400">Downloads: {previewNote?.downloadCount || 0}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewNote(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close Preview
                </button>
                {previewNote && (
                  <button
                    onClick={() => {
                      handleDownload(previewNote.id);
                      setPreviewNote(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
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
              <div className="flex items-center justify-between p-3.5 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100/20 rounded-xl">
                <div>
                  <h5 className="font-bold text-slate-850 dark:text-slate-200 text-xs">{previewNote.subject}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Uploaded by: {previewNote.teacher} • Size: {previewNote.fileSize}</p>
                </div>
                <Badge variant="primary">PDF Resource</Badge>
              </div>

              {/* Mock PDF Content Interface */}
              <div className="border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-6 font-mono text-xs text-slate-700 dark:text-slate-350 min-h-[250px] flex flex-col justify-between">
                <div>
                  <p className="text-center font-bold text-slate-500 uppercase tracking-widest text-[9px] mb-4">--- [ PDF VIEWPORT PREVIEW ] ---</p>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">CAMPUS CONNECT ONLINE RESOURCE REGISTRY</p>
                  <p className="mb-2">Course Module: {previewNote.subject} (Sem {previewNote.semester})</p>
                  <p className="mb-4">Title: {previewNote.title}</p>
                  <p className="leading-relaxed">
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

        {/* Mock Teacher Upload Modal */}
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="📚 Mock Upload Study Notes (Teacher Mode)"
          size="md"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <Input
              label="Document Title"
              placeholder="e.g. Unit 3 Notes: Intermediate Python Loops"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 select-none">Subject</label>
                <select
                  value={newNoteSubject}
                  onChange={(e) => setNewNoteSubject(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Python Programming">Python Programming</option>
                  <option value="Database Management System">Database Management System</option>
                  <option value="Operating System">Operating System</option>
                  <option value="Java Programming">Java Programming</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 select-none">Semester</label>
                <select
                  value={newNoteSemester}
                  onChange={(e) => setNewNoteSemester(Number(e.target.value))}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500"
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
              />
              <Input
                label="File Size"
                value={newNoteSize}
                onChange={(e) => setNewNoteSize(e.target.value)}
                required
              />
            </div>

            <div className="border-t border-slate-50 dark:border-slate-900 my-4 pt-4" />
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
                placeholder="e.g. Python Loops Assignment"
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

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-50 dark:border-slate-900">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Confirm Upload
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
