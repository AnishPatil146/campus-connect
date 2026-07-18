'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketProvider';
import { useAuth } from './AuthProvider';
import { api } from '../utils/api';

// Data structures matching application views
export interface Note {
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
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  registrationEnd: string;
  seatsTotal: number;
  seatsLeft: number;
  isParticipating: boolean;
  category: 'technical' | 'sports' | 'cultural' | 'academic';
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'results' | 'notices' | 'warnings' | 'holidays' | 'exams';
  date: string;
  content: string;
  isRead: boolean;
  target?: string;
}

interface StudentDataContextType {
  notes: Note[];
  events: Event[];
  announcements: Announcement[];
  loading: boolean;
  addNote: (note: Omit<Note, 'id' | 'downloadCount' | 'uploadDate'>) => Promise<void>;
  toggleEventParticipation: (eventId: string) => Promise<void>;
  toggleAnnouncementRead: (announcementId: string) => void;
  incrementDownload: (noteId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // ────────────────── Data Fetching Handlers ──────────────────

  const fetchNotes = useCallback(async () => {
    try {
      const resp = await api.getStudentNotes();
      if (resp.success && resp.data) {
        setNotes(resp.data);
      }
    } catch (err) {
      console.warn('Failed to load notes from API:', err);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const resp = await api.getAnnouncements();
      if (resp.success && resp.data) {
        // Read IDs tracking helper
        const readIdsStr = typeof window !== 'undefined' ? localStorage.getItem('cc_read_announcements') || '[]' : '[]';
        let readIds: string[] = [];
        try { readIds = JSON.parse(readIdsStr); } catch (_) {}

        const mapped: Announcement[] = resp.data.map((ann: any) => ({
          id: ann.id,
          title: ann.title,
          category: (ann.category?.toLowerCase() || 'notices') as any,
          date: new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          content: ann.content,
          isRead: readIds.includes(ann.id),
          target: ann.target,
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.warn('Failed to load announcements from API:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const resp = await api.getEvents();
      if (resp.success && resp.data) {
        const mapped: Event[] = resp.data.map((evt: any) => {
          const seatsTotal = evt.maximumParticipants || 100;
          const registeredCount = Array.isArray(evt.registrations) ? evt.registrations.length : 0;
          
          const isParticipating = Array.isArray(evt.registrations)
            ? evt.registrations.some((r: any) => 
                r.studentId === user?.id || 
                r.userId === user?.id || 
                (r.student && r.student.userId === user?.id)
              )
            : false;

          return {
            id: evt.id,
            title: evt.title,
            date: new Date(evt.startDatetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: new Date(evt.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                  (evt.endDatetime ? ' - ' + new Date(evt.endDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
            venue: evt.venue || 'Main Auditorium',
            organizer: evt.createdBy?.name || 'CSE Department',
            registrationEnd: evt.registrationEnd ? new Date(evt.registrationEnd).toLocaleDateString('en-IN') : 'N/A',
            seatsTotal,
            seatsLeft: Math.max(0, seatsTotal - registeredCount),
            isParticipating,
            category: (evt.category?.name?.toLowerCase() || 'technical') as any,
            description: evt.description || '',
          };
        });
        setEvents(mapped);
      }
    } catch (err) {
      console.warn('Failed to load events from API:', err);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchNotes(), fetchAnnouncements(), fetchEvents()]);
    setLoading(false);
  }, [fetchNotes, fetchAnnouncements, fetchEvents]);

  // Fetch initial records on login state change
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setNotes([]);
      setEvents([]);
      setAnnouncements([]);
      setLoading(false);
    }
  }, [user, refreshData]);

  // ────────────────── Socket.IO Event Listener Handlers ──────────────────

  useEffect(() => {
    if (!socket || !user) return;

    // 1. Note uploaded listener
    const handleNoteUploaded = (newNote: any) => {
      setNotes(prev => {
        if (prev.some(n => n.id === newNote.id)) return prev;
        const mapped: Note = {
          id: newNote.id,
          title: newNote.title,
          subject: newNote.subject?.name || 'Subject',
          semester: newNote.semester?.number || 1,
          teacher: newNote.teacher?.user?.name || 'Faculty',
          uploadDate: new Date(newNote.createdAt).toLocaleDateString(),
          fileSize: newNote.fileSize ? `${(newNote.fileSize / (1024 * 1024)).toFixed(1)} MB` : '2.5 MB',
          downloadCount: 0,
          pdfUrl: newNote.fileUrl || '/files/mock-pdf.pdf',
          videoUrl: newNote.videoUrl || undefined,
          referenceLinks: newNote.referenceLinks || undefined,
          assignments: newNote.assignments || undefined,
        };
        return [mapped, ...prev];
      });
    };

    // 2. Announcements triggers
    const handleAnnouncementCreated = (ann: any) => {
      setAnnouncements(prev => {
        if (prev.some(a => a.id === ann.id)) return prev;
        const mapped: Announcement = {
          id: ann.id,
          title: ann.title,
          category: (ann.category?.toLowerCase() || 'notices') as any,
          date: new Date(ann.createdAt).toLocaleDateString(),
          content: ann.content,
          isRead: false,
          target: ann.target,
        };
        return [mapped, ...prev];
      });
    };

    const handleAnnouncementUpdated = (ann: any) => {
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === ann.id
            ? {
                ...a,
                title: ann.title,
                category: (ann.category?.toLowerCase() || a.category) as any,
                content: ann.content,
              }
            : a
        )
      );
    };

    const handleAnnouncementDeleted = ({ id }: { id: string }) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    // 3. Events triggers
    const handleEventCreated = (evt: any) => {
      setEvents(prev => {
        if (prev.some(e => e.id === evt.id)) return prev;
        const seatsTotal = evt.maximumParticipants || 100;
        const registeredCount = Array.isArray(evt.registrations) ? evt.registrations.length : 0;
        
        const isParticipating = Array.isArray(evt.registrations)
          ? evt.registrations.some((r: any) => 
              r.studentId === user.id || 
              r.userId === user.id || 
              (r.student && r.student.userId === user.id)
            )
          : false;

        const mapped: Event = {
          id: evt.id,
          title: evt.title,
          date: new Date(evt.startDatetime).toLocaleDateString(),
          time: new Date(evt.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                (evt.endDatetime ? ' - ' + new Date(evt.endDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
          venue: evt.venue || 'Main Auditorium',
          organizer: evt.createdBy?.name || 'CSE Department',
          registrationEnd: evt.registrationEnd ? new Date(evt.registrationEnd).toLocaleDateString() : 'N/A',
          seatsTotal,
          seatsLeft: Math.max(0, seatsTotal - registeredCount),
          isParticipating,
          category: (evt.category?.name?.toLowerCase() || 'technical') as any,
          description: evt.description || '',
        };
        return [mapped, ...prev];
      });
    };

    const handleEventUpdated = (evt: any) => {
      setEvents(prev =>
        prev.map(e => {
          if (e.id === evt.id) {
            const seatsTotal = evt.maximumParticipants || 100;
            const registeredCount = Array.isArray(evt.registrations) ? evt.registrations.length : 0;
            const isParticipating = Array.isArray(evt.registrations)
              ? evt.registrations.some((r: any) => 
                  r.studentId === user.id || 
                  r.userId === user.id || 
                  (r.student && r.student.userId === user.id)
                )
              : false;

            return {
              ...e,
              title: evt.title,
              description: evt.description || '',
              venue: evt.venue || e.venue,
              date: new Date(evt.startDatetime).toLocaleDateString(),
              time: new Date(evt.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                    (evt.endDatetime ? ' - ' + new Date(evt.endDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
              seatsTotal,
              seatsLeft: Math.max(0, seatsTotal - registeredCount),
              isParticipating,
              category: (evt.category?.name?.toLowerCase() || e.category) as any,
            };
          }
          return e;
        })
      );
    };

    const handleEventDeleted = ({ id }: { id: string }) => {
      setEvents(prev => prev.filter(e => e.id !== id));
    };

    const handleEventRegistration = (data: { eventId: string; registration: any }) => {
      setEvents(prev =>
        prev.map(e => {
          if (e.id === data.eventId) {
            const isMe = data.registration.studentId === user.id || 
                         data.registration.userId === user.id || 
                         (data.registration.student && data.registration.student.userId === user.id);
            return {
              ...e,
              seatsLeft: Math.max(0, e.seatsLeft - 1),
              isParticipating: isMe ? true : e.isParticipating,
            };
          }
          return e;
        })
      );
    };

    // Subscriptions setup
    socket.on('noteUploaded', handleNoteUploaded);
    socket.on('ANNOUNCEMENT.CREATED', handleAnnouncementCreated);
    socket.on('ANNOUNCEMENT.UPDATED', handleAnnouncementUpdated);
    socket.on('ANNOUNCEMENT.DELETED', handleAnnouncementDeleted);
    socket.on('EVENT.CREATED', handleEventCreated);
    socket.on('EVENT.PUBLISHED', handleEventCreated);
    socket.on('EVENT.UPDATED', handleEventUpdated);
    socket.on('EVENT.DELETED', handleEventDeleted);
    socket.on('EVENT.REGISTRATION', handleEventRegistration);

    return () => {
      socket.off('noteUploaded', handleNoteUploaded);
      socket.off('ANNOUNCEMENT.CREATED', handleAnnouncementCreated);
      socket.off('ANNOUNCEMENT.UPDATED', handleAnnouncementUpdated);
      socket.off('ANNOUNCEMENT.DELETED', handleAnnouncementDeleted);
      socket.off('EVENT.CREATED', handleEventCreated);
      socket.off('EVENT.PUBLISHED', handleEventCreated);
      socket.off('EVENT.UPDATED', handleEventUpdated);
      socket.off('EVENT.DELETED', handleEventDeleted);
      socket.off('EVENT.REGISTRATION', handleEventRegistration);
    };
  }, [socket, user]);

  // ────────────────── Interaction Actions ──────────────────

  const addNote = async (newNote: Omit<Note, 'id' | 'downloadCount' | 'uploadDate'>) => {
    try {
      const resp = await api.uploadTeacherNote(newNote);
      if (resp.success) {
        await fetchNotes();
      }
    } catch (err) {
      console.warn('Failed to upload note:', err);
    }
  };

  const toggleEventParticipation = async (eventId: string) => {
    try {
      const resp = await api.registerForEvent(eventId);
      if (resp.success) {
        // Toggle locally for instant visual feedback, while socket handles count updates
        setEvents(prev =>
          prev.map(evt => {
            if (evt.id === eventId) {
              const nextStatus = !evt.isParticipating;
              return {
                ...evt,
                isParticipating: nextStatus,
                seatsLeft: nextStatus ? Math.max(0, evt.seatsLeft - 1) : evt.seatsLeft + 1,
              };
            }
            return evt;
          })
        );
      }
    } catch (err) {
      console.warn('Failed to register for event:', err);
    }
  };

  const toggleAnnouncementRead = (announcementId: string) => {
    const readIdsStr = typeof window !== 'undefined' ? localStorage.getItem('cc_read_announcements') || '[]' : '[]';
    let readIds: string[] = [];
    try { readIds = JSON.parse(readIdsStr); } catch (_) {}

    if (readIds.includes(announcementId)) {
      readIds = readIds.filter(id => id !== announcementId);
    } else {
      readIds.push(announcementId);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_read_announcements', JSON.stringify(readIds));
    }

    setAnnouncements(prev =>
      prev.map(ann => (ann.id === announcementId ? { ...ann, isRead: !ann.isRead } : ann))
    );
  };

  const incrementDownload = async (noteId: string) => {
    try {
      const success = await api.recordDownload(noteId);
      if (success) {
        setNotes(prev =>
          prev.map(n => (n.id === noteId ? { ...n, downloadCount: n.downloadCount + 1 } : n))
        );
      }
    } catch (err) {
      console.warn('Failed to increment download count:', err);
    }
  };

  return (
    <StudentDataContext.Provider
      value={{
        notes,
        events,
        announcements,
        loading,
        addNote,
        toggleEventParticipation,
        toggleAnnouncementRead,
        incrementDownload,
        refreshData,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};
