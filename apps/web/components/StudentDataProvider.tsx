'use client';

import React, { createContext, useContext, useState } from 'react';

// Data types
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
  addNote: (note: Omit<Note, 'id' | 'downloadCount' | 'uploadDate'>) => void;
  toggleEventParticipation: (eventId: string) => void;
  toggleAnnouncementRead: (announcementId: string) => void;
  incrementDownload: (noteId: string) => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock initial notes data
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 'note-1',
      title: 'Unit 1: Introduction to Relational Databases',
      subject: 'Database Management System',
      semester: 1,
      teacher: 'Dr. Sarah Jenkins',
      uploadDate: '2026-07-01',
      fileSize: '2.5 MB',
      downloadCount: 34,
      pdfUrl: '/files/dbms-unit1.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      referenceLinks: [
        { name: 'Codd\'s 12 Rules of RDBMS', url: 'https://en.wikipedia.org/wiki/Codd%27s_12_rules' },
        { name: 'SQL Basics Cheat Sheet', url: 'https://sqlbolt.com/' }
      ],
      assignments: [
        { title: 'DBMS Assignment 1: Schema Design', dueDate: '2026-07-12' }
      ]
    },
    {
      id: 'note-2',
      title: 'Unit 2: ER Diagrams and Normalization',
      subject: 'Database Management System',
      semester: 1,
      teacher: 'Dr. Sarah Jenkins',
      uploadDate: '2026-07-02',
      fileSize: '3.1 MB',
      downloadCount: 28,
      pdfUrl: '/files/dbms-unit2.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      referenceLinks: [
        { name: 'Normalization Guide', url: 'https://www.geeksforgeeks.org/dbms-normalization-rules/' }
      ]
    },
    {
      id: 'note-3',
      title: 'Unit 1: Process Management & CPU Scheduling',
      subject: 'Operating System',
      semester: 1,
      teacher: 'Prof. Alan Turing',
      uploadDate: '2026-07-02',
      fileSize: '4.2 MB',
      downloadCount: 56,
      pdfUrl: '/files/os-unit1.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'note-4',
      title: 'Unit 1: Basics of Python Syntax & Control Flows',
      subject: 'Python Programming',
      semester: 1,
      teacher: 'Prof. Amit Patil',
      uploadDate: '2026-07-03',
      fileSize: '2.1 MB',
      downloadCount: 45,
      pdfUrl: '/files/python-unit1.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      referenceLinks: [
        { name: 'Official Python Tutorial', url: 'https://docs.python.org/3/tutorial/' }
      ],
      assignments: [
        { title: 'Python Assignment 1: Basic Math Scripts', dueDate: '2026-07-10' }
      ]
    }
  ]);

  // Mock initial events
  const [events, setEvents] = useState<Event[]>([
    {
      id: 'evt-1',
      title: 'Tech Fest 2026 Hackathon',
      date: '15 July 2026',
      time: '09:00 AM - 09:00 PM',
      venue: 'Main Auditorium',
      organizer: 'CSE Department',
      registrationEnd: '10 July 2026',
      seatsTotal: 100,
      seatsLeft: 40,
      isParticipating: false,
      category: 'technical',
      description: 'A 12-hour hackathon to build open-source campus productivity tools. Food and swags provided.'
    },
    {
      id: 'evt-2',
      title: 'Inter-College Basketball Finals',
      date: '18 July 2026',
      time: '04:00 PM - 06:00 PM',
      venue: 'Campus Indoor Stadium',
      organizer: 'Sports Association',
      registrationEnd: '16 July 2026',
      seatsTotal: 50,
      seatsLeft: 12,
      isParticipating: false,
      category: 'sports',
      description: 'Cheer for the home team in the grand finals of the Inter-College Basketball championship!'
    },
    {
      id: 'evt-3',
      title: 'Annual Cultural Fusion Night',
      date: '22 July 2026',
      time: '06:30 PM - 10:00 PM',
      venue: 'Open Air Theatre',
      organizer: 'Cultural Committee',
      registrationEnd: '20 July 2026',
      seatsTotal: 250,
      seatsLeft: 89,
      isParticipating: false,
      category: 'cultural',
      description: 'A vibrant evening showcasing classical dance, fusion music bands, and theatre performances.'
    }
  ]);

  // Mock initial announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann-1',
      title: 'Semester Results Published',
      category: 'results',
      date: '3 July 2026',
      content: 'The end-semester exam results for all courses in Semester 3 are now available. You can view your scorecard under the Performance tab.',
      isRead: false
    },
    {
      id: 'ann-2',
      title: 'Attendance Warning',
      category: 'warnings',
      date: '2 July 2026',
      content: 'Attention students: Several divisions have average attendance below 75%. Please ensure you attend regular lectures to avoid exam detentions.',
      isRead: false
    },
    {
      id: 'ann-3',
      title: 'Mid Semester Examination Schedule',
      category: 'exams',
      date: '1 July 2026',
      content: 'The Mid Semester assessments will commence on July 20th, 2026. The detailed subject-wise timetable is updated on the Timetable page.',
      isRead: true
    },
    {
      id: 'ann-4',
      title: 'Monsoon Holiday Notice',
      category: 'holidays',
      date: '28 June 2026',
      content: 'The college will remain closed on Saturday, July 11th, 2026 on account of local heavy rains forecasts.',
      isRead: true
    }
  ]);

  const addNote = (newNote: Omit<Note, 'id' | 'downloadCount' | 'uploadDate'>) => {
    const note: Note = {
      ...newNote,
      id: `note-${Date.now()}`,
      downloadCount: 0,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setNotes(prev => [note, ...prev]);
  };

  const toggleEventParticipation = (eventId: string) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const isRegistering = !evt.isParticipating;
          return {
            ...evt,
            isParticipating: isRegistering,
            seatsLeft: isRegistering ? evt.seatsLeft - 1 : evt.seatsLeft + 1
          };
        }
        return evt;
      })
    );
  };

  const toggleAnnouncementRead = (announcementId: string) => {
    setAnnouncements(prev =>
      prev.map(ann => (ann.id === announcementId ? { ...ann, isRead: !ann.isRead } : ann))
    );
  };

  const incrementDownload = (noteId: string) => {
    setNotes(prev =>
      prev.map(note => (note.id === noteId ? { ...note, downloadCount: note.downloadCount + 1 } : note))
    );
  };

  return (
    <StudentDataContext.Provider
      value={{
        notes,
        events,
        announcements,
        addNote,
        toggleEventParticipation,
        toggleAnnouncementRead,
        incrementDownload
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
