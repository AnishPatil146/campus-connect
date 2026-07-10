export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type CollegeId = 'college-a' | 'college-b' | 'college-c';

export interface College {
  id: CollegeId;
  name: string;
  code: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  collegeId: CollegeId;
  createdAt: string;
  updatedAt: string;
  studentProfile?: {
    id: string;
    userId: string;
    collegeId: string;
    departmentId: string;
    courseId: string;
    semesterId: string;
    divisionId: string;
    admissionNo: string;
    rollNumber: string;
    status: string;
  } | null;
  teacherProfile?: {
    id: string;
    userId: string;
    collegeId: string;
    departmentId: string;
    employeeId: string;
  } | null;
}

export interface Student extends User {
  role: 'STUDENT';
  studentId: string; // e.g. Roll number
  department: string;
  semester: number;
  gpa: number;
}

export interface Teacher extends User {
  role: 'TEACHER';
  employeeId: string;
  department: string;
  designation: string;
  courses: string[]; // Course codes / names
}

export interface Admin extends User {
  role: 'ADMIN';
  department?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  teacherId: string;
  teacherName: string;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  classroom: string;
  teacherName: string;
  collegeId: CollegeId;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  time: string;
  location: string;
  collegeId: CollegeId | 'all'; // shared or college-specific
  organizer: string;
  category: 'academic' | 'sports' | 'cultural' | 'technical' | 'general';
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  grade: string; // e.g. "A+", "B"
  marks: number;
  maxMarks: number;
  semester: number;
}

export interface PerformanceAnalytics {
  gpaOverSemesters: { semester: number; gpa: number }[];
  attendanceRate: number; // percentage
  classAverageGpa: number;
}
