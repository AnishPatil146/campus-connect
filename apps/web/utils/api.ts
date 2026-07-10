import { UserRole, CollegeId } from '@campus-connect/types';

export interface StudentRecord {
  id: string;
  userId: string;
  rollNumber: string;
  admissionNumber: string;
  gender: string;
  dateOfBirth: string;
  mobile: string;
  address: string;
  profilePhoto: string;
  parentName: string;
  motherName?: string;
  fatherName?: string;
  parentMobile: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    collegeId: CollegeId;
    createdAt: string;
  };
  division: {
    id: string;
    name: string;
    semester: {
      id: string;
      name: string;
      academicSession: {
        id: string;
        name: string;
        course: {
          id: string;
          name: string;
          department: {
            id: string;
            name: string;
            college: {
              id: string;
              name: string;
            };
          };
        };
      };
    };
  };
}

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Get auth headers
function getHeaders() {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('cc_user') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userStr) {
    try {
      JSON.parse(userStr);
      // If we had a real token, we would use it:
      const token = localStorage.getItem('cc_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) {}
  }
  return headers;
}

// Check if API is responsive
async function pingAPI(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/health`, { 
      method: 'GET',
      headers: getHeaders(),
      signal: AbortSignal.timeout(1500) // quick timeout
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ----------------- Mock Database Storage Fallback -----------------
const MOCK_INITIAL_STUDENTS: StudentRecord[] = [];

function getMockStudents(): StudentRecord[] {
  if (typeof window === 'undefined') return MOCK_INITIAL_STUDENTS;
  const stored = localStorage.getItem('cc_mock_students');
  if (!stored) {
    localStorage.setItem('cc_mock_students', JSON.stringify(MOCK_INITIAL_STUDENTS));
    return MOCK_INITIAL_STUDENTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_INITIAL_STUDENTS;
  }
}

function saveMockStudents(students: StudentRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cc_mock_students', JSON.stringify(students));
  }
}

// ----------------- Task Record Interface -----------------
export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ----------------- Mock Task Storage Fallback -----------------
const MOCK_INITIAL_TASKS: TaskRecord[] = [
  {
    id: 'mock-task-001',
    title: 'Upload DBMS Unit 2 Notes',
    description: 'Please upload the lecture notes for Database Management Systems Unit 2 — ER Diagrams & Normalization.',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: 'PENDING',
    assignedTo: { id: 'usr-teacher-1', name: 'Prof. Amit Patil', email: 'amit.patil@collegec.edu' },
    createdBy: { id: 'usr-admin-mock', name: 'College Admin', email: 'admin@collegec.edu' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-task-002',
    title: 'Complete Attendance by 5 PM',
    description: 'Mark attendance for all lectures conducted today by 5:00 PM deadline.',
    dueDate: new Date().toISOString(),
    status: 'PENDING',
    assignedTo: { id: 'usr-teacher-1', name: 'Prof. Amit Patil', email: 'amit.patil@collegec.edu' },
    createdBy: { id: 'usr-admin-mock', name: 'College Admin', email: 'admin@collegec.edu' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-task-003',
    title: 'Verify Student Documents',
    description: 'Verify admission documents for 5 newly enrolled students in FY BSc IT.',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    status: 'COMPLETED',
    assignedTo: { id: 'usr-teacher-2', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@collegec.edu' },
    createdBy: { id: 'usr-admin-mock', name: 'College Admin', email: 'admin@collegec.edu' },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-task-004',
    title: 'Submit Internal Assessment Marks',
    description: 'Submit IA-1 marks for Operating Systems (SY BSc IT) to examination cell.',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    assignedTo: { id: 'usr-teacher-2', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@collegec.edu' },
    createdBy: { id: 'usr-admin-mock', name: 'College Admin', email: 'admin@collegec.edu' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getMockTasks(): TaskRecord[] {
  if (typeof window === 'undefined') return MOCK_INITIAL_TASKS;
  const stored = localStorage.getItem('cc_mock_tasks');
  if (!stored) {
    localStorage.setItem('cc_mock_tasks', JSON.stringify(MOCK_INITIAL_TASKS));
    return MOCK_INITIAL_TASKS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_INITIAL_TASKS;
  }
}

function saveMockTasks(tasks: TaskRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cc_mock_tasks', JSON.stringify(tasks));
  }
}

// ----------------- Timetable Record Interface -----------------
export interface TimetableEntry {
  id: string;
  subject: string;
  course: string;
  division: string;
  teacher: string;
  classroom: string;
  day: string;
  timeSlot: string;
  subjectCode?: string;
}

const MOCK_INITIAL_TIMETABLE: TimetableEntry[] = [
  { id: '1', subject: 'Database Management Systems', course: 'BSc IT', division: 'Division A', teacher: 'Prof. Amit Patil', classroom: 'Room 301', day: 'Monday', timeSlot: '09:00 AM - 10:30 AM', subjectCode: 'CS-401' },
  { id: '2', subject: 'Operating Systems', course: 'BSc IT', division: 'Division A', teacher: 'Dr. Sarah Jenkins', classroom: 'Room 302', day: 'Monday', timeSlot: '11:00 AM - 12:30 PM', subjectCode: 'CS-402' },
  { id: '3', subject: 'Python Programming', course: 'BSc IT', division: 'Division A', teacher: 'Prof. Amit Patil', classroom: 'Room 301', day: 'Tuesday', timeSlot: '11:00 AM - 12:30 PM', subjectCode: 'CS-403' },
  { id: '4', subject: 'Discrete Mathematics', course: 'BSc IT', division: 'Division A', teacher: 'Dr. Sarah Jenkins', classroom: 'Room 303', day: 'Wednesday', timeSlot: '02:00 PM - 03:30 PM', subjectCode: 'MATH-405' },
];

function getMockTimetable(): TimetableEntry[] {
  if (typeof window === 'undefined') return MOCK_INITIAL_TIMETABLE;
  const stored = localStorage.getItem('cc_mock_timetable');
  if (!stored) {
    localStorage.setItem('cc_mock_timetable', JSON.stringify(MOCK_INITIAL_TIMETABLE));
    return MOCK_INITIAL_TIMETABLE;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_INITIAL_TIMETABLE;
  }
}

function saveMockTimetable(entries: TimetableEntry[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cc_mock_timetable', JSON.stringify(entries));
  }
}

// ----------------- Exported Client API Layer -----------------
export const api = {
  isDevMode: false,

  async getStudents(query?: {
    search?: string;
    collegeId?: string;
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    divisionId?: string;
    status?: string;
  }): Promise<{ success: boolean; data: StudentRecord[]; fromCache: boolean }> {
    const isOnline = await pingAPI();
    this.isDevMode = !isOnline;

    if (isOnline) {
      try {
        const queryParams = new URLSearchParams();
        if (query?.search) queryParams.append('search', query.search);
        if (query?.collegeId) queryParams.append('collegeId', query.collegeId);
        if (query?.departmentId) queryParams.append('departmentId', query.departmentId);
        if (query?.courseId) queryParams.append('courseId', query.courseId);
        if (query?.semesterId) queryParams.append('semesterId', query.semesterId);
        if (query?.divisionId) queryParams.append('divisionId', query.divisionId);
        if (query?.status) queryParams.append('status', query.status);

        const res = await fetch(`${API_BASE_URL}/students?${queryParams.toString()}`, {
          method: 'GET',
          headers: getHeaders(),
        });
        const payload = await res.json();
        if (payload.success) {
          return { success: true, data: payload.data, fromCache: false };
        }
      } catch (err) {
        console.warn('Failed to fetch from NestJS API, falling back to Mock Storage:', err);
      }
    }

    // Mock Fallback implementation
    let list = getMockStudents();

    // Filters
    if (query?.status === 'deleted') {
      // For mock, status deleted means isActive is false, or we filter out
      list = list.filter(s => !s.isActive); 
    } else if (query?.status === 'inactive') {
      list = list.filter(s => !s.isActive);
    } else {
      // Default Active
      list = list.filter(s => s.isActive);
    }

    if (query?.collegeId && query.collegeId !== 'all') {
      list = list.filter(s => s.user.collegeId === query.collegeId);
    }
    if (query?.departmentId && query.departmentId !== 'all') {
      list = list.filter(s => s.division.semester.academicSession.course.department.id === query.departmentId);
    }
    if (query?.courseId && query.courseId !== 'all') {
      list = list.filter(s => s.division.semester.academicSession.course.id === query.courseId);
    }
    if (query?.semesterId && query.semesterId !== 'all') {
      list = list.filter(s => s.division.semester.id === query.semesterId);
    }
    if (query?.divisionId && query.divisionId !== 'all') {
      list = list.filter(s => s.division.id === query.divisionId);
    }

    if (query?.search) {
      const s = query.search.toLowerCase().trim();
      list = list.filter(
        item =>
          item.user.name.toLowerCase().includes(s) ||
          item.user.email.toLowerCase().includes(s) ||
          item.rollNumber.toLowerCase().includes(s) ||
          item.admissionNumber.toLowerCase().includes(s)
      );
    }

    return { success: true, data: list, fromCache: true };
  },

  async getStudent(id: string): Promise<StudentRecord> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          headers: getHeaders(),
        });
        const payload = await res.json();
        if (payload.success) return payload.data;
      } catch (e) {}
    }

    const matched = getMockStudents().find(s => s.id === id);
    if (!matched) throw new Error('Student not found');
    return matched;
  },

  async createStudent(payload: {
    email: string;
    name: string;
    divisionId: string;
    rollNumber?: string;
    admissionNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    mobile?: string;
    address?: string;
    profilePhoto?: string;
    parentName?: string;
    motherName?: string;
    fatherName?: string;
    parentMobile?: string;
    collegeId: CollegeId;
  }): Promise<StudentRecord> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/students`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const resp = await res.json();
        if (resp.success) return resp.data;
      } catch (e) {}
    }

    // Mock implementation
    const students = getMockStudents();
    const isEmailTaken = students.some(s => s.user.email.toLowerCase() === payload.email.toLowerCase());
    if (isEmailTaken) throw new Error(`Email "${payload.email}" already registered`);

    // Resolve static academic hierarchy labels for display mock
    const collegeNames: Record<CollegeId, string> = {
      'college-a': "Pushpalata Mhatre Women's College of Arts, Commerce & Science",
      'college-b': 'Balasaheb Mhatre College of Science (Junior)',
      'college-c': 'Balasaheb Mhatre College of Science (Senior)',
    };

    const newStudent: StudentRecord = {
      id: `std-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      rollNumber: payload.rollNumber || `CS-2026-${Math.floor(Math.random() * 900 + 100)}`,
      admissionNumber: payload.admissionNumber || `ADM-${Math.floor(Math.random() * 900000 + 100000)}`,
      gender: payload.gender || 'Male',
      dateOfBirth: payload.dateOfBirth || '2005-01-01',
      mobile: payload.mobile || '+91 9999999999',
      address: payload.address || 'Mock Address, Mumbai',
      profilePhoto: payload.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      parentName: payload.parentName || 'Mock Parent Name',
      motherName: payload.motherName || 'Mock Mother Name',
      fatherName: payload.fatherName || 'Mock Father Name',
      parentMobile: payload.parentMobile || '+91 8888888888',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: `usr-${Date.now()}`,
        email: payload.email,
        name: payload.name,
        role: 'STUDENT',
        collegeId: payload.collegeId,
        createdAt: new Date().toISOString(),
      },
      division: {
        id: payload.divisionId,
        name: payload.divisionId === 'div-a' ? 'Division A' : 'Division B',
        semester: {
          id: 'sem-1',
          name: 'Semester 1',
          academicSession: {
            id: 'session-1',
            name: '2026-27',
            course: {
              id: 'course-bscit',
              name: 'BSc IT',
              department: {
                id: 'dept-cs',
                name: 'Computer Science',
                college: {
                  id: payload.collegeId,
                  name: collegeNames[payload.collegeId] || 'Balasaheb Mhatre College of Science (Senior)',
                },
              },
            },
          },
        },
      },
    };

    students.unshift(newStudent);
    saveMockStudents(students);
    
    // Log a simulated audit action
    const storedLogs = localStorage.getItem('cc_audit_logs') || '[]';
    const auditLogs = JSON.parse(storedLogs);
    auditLogs.unshift({
      time: new Date().toLocaleTimeString(),
      user: 'Admin',
      action: `Added Student (${payload.name})`
    });
    localStorage.setItem('cc_audit_logs', JSON.stringify(auditLogs.slice(0, 10)));

    return newStudent;
  },

  async updateStudent(id: string, payload: Partial<StudentRecord> & { name?: string; divisionId?: string }): Promise<StudentRecord> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const resp = await res.json();
        if (resp.success) return resp.data;
      } catch (e) {}
    }

    const students = getMockStudents();
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Student not found');

    const original = students[idx];
    const updatedUser = {
      ...original.user,
      name: payload.name || original.user.name,
    };

    const updated: StudentRecord = {
      ...original,
      ...payload,
      user: updatedUser,
      updatedAt: new Date().toISOString(),
    } as StudentRecord;

    students[idx] = updated;
    saveMockStudents(students);
    return updated;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        const resp = await res.json();
        if (resp.success) return true;
      } catch (e) {}
    }

    const students = getMockStudents();
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return false;

    // Soft delete mock
    students[idx].isActive = false;
    students[idx].updatedAt = new Date().toISOString();
    saveMockStudents(students);
    return true;
  },

  async resetPassword(id: string, password?: string): Promise<boolean> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/students/${id}/reset-password`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ password }),
        });
        const resp = await res.json();
        if (resp.success) return true;
      } catch (e) {}
    }
    // Mock always returns success
    return true;
  },

  // ===================== TASKS API =====================

  async getTasks(): Promise<{ data: TaskRecord[]; fromCache: boolean }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks`, { headers: getHeaders() });
        const resp = await res.json();
        if (resp.success) return { data: resp.data, fromCache: false };
      } catch (e) {}
    }
    return { data: getMockTasks(), fromCache: true };
  },

  async getAssignedTasks(): Promise<{ data: TaskRecord[]; fromCache: boolean }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/assigned`, { headers: getHeaders() });
        const resp = await res.json();
        if (resp.success) return { data: resp.data, fromCache: false };
      } catch (e) {}
    }
    // For mock: return tasks assigned to the current mock user
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('cc_user') : null;
    let userId = '';
    if (userStr) {
      try { userId = JSON.parse(userStr).id; } catch (_) {}
    }
    const tasks = getMockTasks().filter(t => t.assignedTo?.id === userId || true); // Show all in mock
    return { data: tasks, fromCache: true };
  },

  async createTask(payload: { title: string; description?: string; dueDate: string; assignedToId: string; assignedToName?: string }): Promise<TaskRecord> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const resp = await res.json();
        if (resp.success) return resp.data;
      } catch (e) {}
    }
    // Mock create
    const tasks = getMockTasks();
    const newTask: TaskRecord = {
      id: `mock-task-${Date.now()}`,
      title: payload.title,
      description: payload.description || null,
      dueDate: payload.dueDate,
      status: 'PENDING',
      assignedTo: {
        id: payload.assignedToId,
        name: payload.assignedToName || 'Teacher',
        email: 'teacher@collegec.edu',
      },
      createdBy: {
        id: 'usr-admin-mock',
        name: 'College Admin',
        email: 'admin@collegec.edu',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    saveMockTasks(tasks);
    return newTask;
  },

  async updateTaskStatus(id: string, status: 'PENDING' | 'COMPLETED'): Promise<TaskRecord> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ status }),
        });
        const resp = await res.json();
        if (resp.success) return resp.data;
      } catch (e) {}
    }
    // Mock update
    const tasks = getMockTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    tasks[idx].status = status;
    tasks[idx].updatedAt = new Date().toISOString();
    saveMockTasks(tasks);
    return tasks[idx];
  },

  async deleteTask(id: string): Promise<boolean> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        const resp = await res.json();
        if (resp.success) return true;
      } catch (e) {}
    }
    const tasks = getMockTasks();
    const filtered = tasks.filter(t => t.id !== id);
    saveMockTasks(filtered);
    return true;
  },

  async getTasksSummary(): Promise<{ total: number; completed: number; pending: number }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/summary`, { headers: getHeaders() });
        const resp = await res.json();
        if (resp.success) return resp.data;
      } catch (e) {}
    }
    const tasks = getMockTasks();
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return { total: tasks.length, completed, pending: tasks.length - completed };
  },

  async getTimetable(): Promise<TimetableEntry[]> {
    return getMockTimetable();
  },

  async saveTimetable(entries: TimetableEntry[]): Promise<boolean> {
    saveMockTimetable(entries);
    return true;
  },

  async addTimetableEntries(entries: TimetableEntry[]): Promise<boolean> {
    const existing = getMockTimetable();
    const updated = [...existing, ...entries];
    saveMockTimetable(updated);
    return true;
  },

  async register(payload: any): Promise<{ success: boolean; data: any }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const resp = await res.json();
        return { success: res.ok, data: resp };
      } catch (err) {
        console.error('Registration failed:', err);
      }
    }
    // Mock handler (local storage offline mode)
    const storedLogs = localStorage.getItem('cc_audit_logs') || '[]';
    const auditLogs = JSON.parse(storedLogs);
    
    const fullName = payload.firstName ? `${payload.firstName} ${payload.lastName || payload.surname || ''}`.trim() : payload.name;

    // Save user credentials dynamically to allow mock login
    const storedUsers = localStorage.getItem('cc_mock_registered_users') || '[]';
    const registeredUsers = JSON.parse(storedUsers);
    registeredUsers.push({
      id: `usr-${Date.now()}`,
      email: payload.email,
      name: fullName,
      role: payload.role,
      collegeId: payload.collegeId,
      password: payload.password || 'password123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    localStorage.setItem('cc_mock_registered_users', JSON.stringify(registeredUsers));

    if (payload.role === 'STUDENT') {
      const student = await this.createStudent({
        email: payload.email,
        name: fullName,
        collegeId: payload.collegeId,
        divisionId: payload.divisionId || 'div-a',
        rollNumber: payload.rollNumber,
        admissionNumber: payload.admissionNumber,
        gender: payload.gender,
        dateOfBirth: payload.dateOfBirth,
        mobile: payload.mobile,
        address: payload.address,
        parentName: payload.parentName,
        motherName: payload.motherName,
        fatherName: payload.fatherName,
        parentMobile: payload.parentMobile,
      });

      // Log a simulated audit action for admin notification
      auditLogs.unshift({
        id: `mock-audit-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        user: fullName,
        role: 'STUDENT',
        action: 'Student Registered',
        details: `Student registered: ${payload.email}. Classroom: ${payload.classroom || 'N/A'}, Roll: ${payload.rollNumber || 'N/A'}, Semester: ${payload.semester || 'N/A'}, Subjects/Degree: ${payload.courseType === 'DEGREE' ? (payload.degree || 'Degree') : (payload.subjects?.join(', ') || 'None')}`
      });
      localStorage.setItem('cc_audit_logs', JSON.stringify(auditLogs.slice(0, 50)));

      console.log(`[Mock System Alert] Notification dispatched to Admin: New student registered: ${fullName} (${payload.email})`);
      console.log(`[Mock Email Sent] Confirmation email sent to student Gmail: ${payload.email}`);

      return { success: true, data: student };
    } else {
      // Teacher mock registration
      auditLogs.unshift({
        id: `mock-audit-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        user: fullName,
        role: 'TEACHER',
        action: 'Teacher Registered',
        details: `Teacher registered: ${payload.email}. Qualification/Degree: ${payload.degree || 'N/A'}, Department: ${payload.departmentId || 'N/A'}`
      });
      localStorage.setItem('cc_audit_logs', JSON.stringify(auditLogs.slice(0, 50)));

      console.log(`[Mock System Alert] Notification dispatched to Admin: New teacher registered: ${fullName} (${payload.email})`);
      console.log(`[Mock Email Sent] Confirmation email sent to teacher Gmail: ${payload.email}`);

      return { success: true, data: { email: payload.email, name: fullName, role: payload.role } };
    }
  },

  async getAuditLogs(): Promise<{ success: boolean; data: any[] }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/audit-logs`, {
          headers: getHeaders(),
        });
        const payload = await res.json();
        if (payload.success) return { success: true, data: payload.data };
      } catch (err) {
        console.warn('Failed to fetch audit logs from NestJS API:', err);
      }
    }

    // Mock Fallback
    const storedLogs = localStorage.getItem('cc_audit_logs') || '[]';
    try {
      const parsed = JSON.parse(storedLogs);
      const mapped = parsed.map((l: any, idx: number) => ({
        id: l.id || `mock-${idx}`,
        timestamp: l.time || 'Just now',
        userName: l.user || 'System User',
        role: l.role || 'STUDENT',
        action: l.action || 'Performed Action',
        details: l.details || l.action || '',
      }));
      return { success: true, data: mapped };
    } catch (_) {
      return { success: true, data: [] };
    }
  },

  // ────────────────── Announcements ──────────────────

  async getAnnouncements(): Promise<{ success: boolean; data: any[] }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/announcements`, {
          headers: getHeaders(),
        });
        const payload = await res.json();
        if (payload.success) return { success: true, data: payload.data };
      } catch (err) {
        console.warn('Failed to fetch announcements from API:', err);
      }
    }
    return { success: true, data: [] };
  },

  async createAnnouncement(data: {
    title: string;
    content: string;
    category: string;
    target?: string;
    status?: string;
    priority?: string;
    scheduledAt?: string;
  }): Promise<{ success: boolean; data: any; message?: string }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/announcements`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        const payload = await res.json();
        return { success: payload.success, data: payload.data, message: payload.message };
      } catch (err) {
        console.warn('Failed to create announcement:', err);
        return { success: false, data: null, message: 'Network error' };
      }
    }
    return { success: false, data: null, message: 'API is offline' };
  },

  async updateAnnouncement(
    id: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      target?: string;
      status?: string;
      priority?: string;
      scheduledAt?: string;
    }
  ): Promise<{ success: boolean; data: any; message?: string }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/announcements/${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        const payload = await res.json();
        return { success: payload.success, data: payload.data, message: payload.message };
      } catch (err) {
        console.warn('Failed to update announcement:', err);
        return { success: false, data: null, message: 'Network error' };
      }
    }
    return { success: false, data: null, message: 'API is offline' };
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean; message?: string }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/announcements/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        const payload = await res.json();
        return { success: payload.success, message: payload.message };
      } catch (err) {
        console.warn('Failed to delete announcement:', err);
        return { success: false, message: 'Network error' };
      }
    }
    return { success: false, message: 'API is offline' };
  },

  async getStudentAttendance(studentId: string): Promise<{ success: boolean; data: any[] }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/student?studentId=${studentId}`, {
          headers: getHeaders(),
        });
        const payload = await res.json();
        if (payload.success) return { success: true, data: payload.data };
      } catch (err) {
        console.warn('Failed to fetch student attendance from API:', err);
      }
    }
    return { success: true, data: [] };
  },

  async requestLeave(payload: {
    studentId: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason?: string;
  }): Promise<{ success: boolean; data: any; message?: string }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/request`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const resp = await res.json();
        return { success: resp.success, data: resp.data, message: resp.message };
      } catch (err) {
        console.warn('Failed to request leave:', err);
        return { success: false, data: null, message: 'Network error' };
      }
    }
    return { success: false, data: null, message: 'API is offline' };
  },

  async requestCorrection(payload: {
    attendanceRecordId: string;
    reason: string;
  }): Promise<{ success: boolean; data: any; message?: string }> {
    const isOnline = await pingAPI();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/correction`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const resp = await res.json();
        return { success: resp.success, data: resp.data, message: resp.message };
      } catch (err) {
        console.warn('Failed to request correction:', err);
        return { success: false, data: null, message: 'Network error' };
      }
    }
    return { success: false, data: null, message: 'API is offline' };
  },
};

