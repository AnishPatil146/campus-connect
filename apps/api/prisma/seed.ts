import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records in reverse order of dependencies
  await prisma.attendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.noteCategory.deleteMany({});
  await prisma.assignmentMark.deleteMany({});
  await prisma.assignmentFeedback.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.roleModel.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.division.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.academicSession.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.college.deleteMany({});
  await prisma.educationGroup.deleteMany({});

  // 2. Seed all permissions
  const modules = [
    'auth',
    'users',
    'roles',
    'colleges',
    'education-groups',
    'departments',
    'courses',
    'subjects',
    'students',
    'teachers',
    'attendance',
    'timetable',
    'notes',
    'assignments',
    'events',
    'announcements',
    'notifications',
    'reports',
    'analytics',
    'audit',
    'backup',
    'dashboard',
  ];

  const actions = ['create', 'read', 'update', 'delete'];
  const permissionsToCreate: { name: string; module: string; action: string; description: string }[] = [];

  for (const mod of modules) {
    for (const action of actions) {
      permissionsToCreate.push({
        name: `${mod}.${action}`,
        module: mod,
        action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod}`,
      });
    }
  }

  // Add special permissions
  permissionsToCreate.push(
    { name: 'roles.assign', module: 'roles', action: 'assign', description: 'Assign or remove roles from users' },
    { name: 'backup.restore', module: 'backup', action: 'restore', description: 'Restore from backup' },
    { name: 'students.import', module: 'students', action: 'import', description: 'Import students via CSV' },
    { name: 'students.export', module: 'students', action: 'export', description: 'Export students data' },
    { name: 'teachers.import', module: 'teachers', action: 'import', description: 'Import teachers via CSV' },
    { name: 'teachers.export', module: 'teachers', action: 'export', description: 'Export teachers data' },
    { name: 'attendance.mark', module: 'attendance', action: 'mark', description: 'Mark student attendance' },
    { name: 'attendance.report', module: 'attendance', action: 'report', description: 'View attendance reports' },
    { name: 'announcements.publish', module: 'announcements', action: 'publish', description: 'Publish announcements' },
    { name: 'events.register', module: 'events', action: 'register', description: 'Register for events' },
    { name: 'audit.export', module: 'audit', action: 'export', description: 'Export audit logs' },
  );

  for (const perm of permissionsToCreate) {
    await prisma.permission.create({ data: perm });
  }

  const allPerms = await prisma.permission.findMany();



  // ADMIN Role (gets all permissions)
  const adminRole = await prisma.roleModel.create({
    data: {
      name: 'ADMIN',
      description: 'College administrator with full access',
      isSystem: true,
      rolePermissions: {
        create: allPerms.map((p) => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // TEACHER Role
  const teacherPermissionNames = [
    'notes.create', 'notes.read', 'notes.update', 'notes.delete',
    'assignments.create', 'assignments.read', 'assignments.update', 'assignments.delete',
    'attendance.create', 'attendance.read', 'attendance.update', 'attendance.delete',
    'attendance.mark', 'attendance.report',
    'events.create', 'events.read', 'events.register',
    'announcements.create', 'announcements.read', 'announcements.publish',
    'timetable.read', 'students.read', 'dashboard.read'
  ];
  const teacherPermissions = allPerms.filter((p) => teacherPermissionNames.includes(p.name));
  const teacherRole = await prisma.roleModel.create({
    data: {
      name: 'TEACHER',
      description: 'Faculty member',
      isSystem: true,
      rolePermissions: {
        create: teacherPermissions.map((p) => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // STUDENT Role
  const studentPermissionNames = [
    'notes.read', 'events.read', 'events.register', 'announcements.read',
    'timetable.read', 'assignments.read', 'assignments.create', 'attendance.read',
    'courses.read', 'subjects.read', 'semesters.read', 'divisions.read', 'dashboard.read'
  ];
  const studentPermissions = allPerms.filter((p) => studentPermissionNames.includes(p.name));
  const studentRole = await prisma.roleModel.create({
    data: {
      name: 'STUDENT',
      description: 'Enrolled student',
      isSystem: true,
      rolePermissions: {
        create: studentPermissions.map((p) => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // 3. Create Education Group
  const educationGroup = await prisma.educationGroup.create({
    data: {
      name: 'Balasaheb Mhatre Education Group',
    },
  });

  // 4. Create Colleges
  await prisma.college.create({
    data: {
      name: "Pushpalata Mhatre Women's College of Arts, Commerce & Science",
      educationGroupId: educationGroup.id,
    },
  });

  await prisma.college.create({
    data: {
      name: 'Balasaheb Mhatre College of Science (Junior)',
      educationGroupId: educationGroup.id,
    },
  });

  const seniorCollege = await prisma.college.create({
    data: {
      name: 'Balasaheb Mhatre College of Science (Senior)',
      educationGroupId: educationGroup.id,
    },
  });

  // Auto-create default settings for senior college
  await prisma.collegeSetting.create({
    data: { collegeId: seniorCollege.id },
  });

  // 5. Create hierarchy in Balasaheb Mhatre Senior College
  const department = await prisma.department.create({
    data: {
      name: 'Computer Science',
      collegeId: seniorCollege.id,
    },
  });

  const course = await prisma.course.create({
    data: {
      name: 'BSc IT',
      departmentId: department.id,
    },
  });

  const academicSession = await prisma.academicSession.create({
    data: {
      name: '2026-27',
      courseId: course.id,
    },
  });

  const semester = await prisma.semester.create({
    data: {
      name: 'Semester 1',
      academicSessionId: academicSession.id,
    },
  });

  const division = await prisma.division.create({
    data: {
      name: 'Division A',
      semesterId: semester.id,
    },
  });

  // Passwords
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // 6. Create Users and Assign Roles
  // Admin for Balasaheb Mhatre Senior College
  const adminUser = await prisma.user.create({
    data: {
      email: 'anish@college.edu',
      passwordHash: defaultPasswordHash,
      name: 'Anish Patil',
      status: 'ACTIVE',
      collegeId: seniorCollege.id,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
      userProfile: {
        create: {
          firstName: 'Anish',
          lastName: 'Patil',
          phone: '+91 9876543212',
          address: '102, Shanti Nagar, Thane',
          city: 'Thane',
          state: 'Maharashtra',
          country: 'India',
        },
      },
    },
  });

  // Teacher + College Admin (Multi-role User)
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@college.edu',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Sarah Jenkins',
      status: 'ACTIVE',
      collegeId: seniorCollege.id,
      userRoles: {
        createMany: {
          data: [
            { roleId: teacherRole.id },
            { roleId: adminRole.id },
          ],
        },
      },
      userProfile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Jenkins',
          phone: '+91 9876543213',
          address: '204, Royal Heights, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      },
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'TCH-2026-0001',
      collegeId: seniorCollege.id,
      departmentId: department.id,
      joiningDate: new Date(),
      employmentType: 'FULL_TIME',
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Jenkins',
          gender: 'Female',
          dob: new Date('1985-04-12'),
          phone: '+91 9876543213',
          email: 'teacher@college.edu',
        },
      },
      departments: {
        create: {
          departmentId: department.id,
          primaryDepartment: true,
        },
      },
    },
  });

  // Student Profile
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@college.edu',
      passwordHash: defaultPasswordHash,
      name: 'Alex Rivera',
      status: 'ACTIVE',
      collegeId: seniorCollege.id,
      userRoles: {
        create: {
          roleId: studentRole.id,
        },
      },
      userProfile: {
        create: {
          firstName: 'Alex',
          lastName: 'Rivera',
          phone: '+91 9876543210',
          address: '102, Shanti Nagar, Thane',
          city: 'Thane',
          state: 'Maharashtra',
          country: 'India',
        },
      },
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      collegeId: seniorCollege.id,
      departmentId: department.id,
      courseId: course.id,
      semesterId: semester.id,
      divisionId: division.id,
      academicSessionId: academicSession.id,
      admissionNo: 'ADM-902341',
      rollNumber: 'CS-2026-089',
      admissionDate: new Date(),
      currentYear: 1,
      profile: {
        create: {
          firstName: 'Alex',
          lastName: 'Rivera',
          gender: 'Male',
          dob: new Date('2005-05-15'),
          email: 'student@college.edu',
          phone: '+91 9876543210',
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        },
      },
      guardians: {
        create: {
          fatherName: 'Ramesh Rivera',
          phone: '+91 9876543211',
        },
      },
      addresses: {
        create: {
          addressLine: '102, Shanti Nagar, Sector 4',
          city: 'Thane',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400601',
          addressType: 'CURRENT',
        },
      },
      medical: {
        create: {
          bloodGroup: 'O+',
        },
      },
    },
  });

  // Seed subjects
  const dbmsSubject = await prisma.subject.create({
    data: {
      name: 'Database Management Systems',
      code: 'CS-401',
      courseId: course.id,
      departmentId: department.id,
      creditHours: 4,
    },
  });

  const osSubject = await prisma.subject.create({
    data: {
      name: 'Operating Systems',
      code: 'CS-402',
      courseId: course.id,
      departmentId: department.id,
      creditHours: 4,
    },
  });

  const pythonSubject = await prisma.subject.create({
    data: {
      name: 'Python Web Lab',
      code: 'CS-403',
      courseId: course.id,
      departmentId: department.id,
      creditHours: 2,
    },
  });

  const mathSubject = await prisma.subject.create({
    data: {
      name: 'Discrete Mathematics',
      code: 'MATH-405',
      courseId: course.id,
      departmentId: department.id,
      creditHours: 4,
    },
  });

  // Seed attendance sessions & records for Alex Rivera (July 2026)
  const JulyAttendanceList = [
    { day: 1, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 2, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 3, status: 'ABSENT', subject: pythonSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'No Attendance Recorded - Unexcused' },
    { day: 4, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 5, status: 'LEAVE', subject: mathSubject, timeSlot: '02:00 PM - 03:30 PM', reason: 'Medical Checkup - Approved by Class Teacher' },
    { day: 6, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 7, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 8, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 10, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 13, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 14, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 15, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 16, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 17, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 20, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 21, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 22, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 23, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 24, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 27, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 28, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
    { day: 29, status: 'ABSENT', subject: pythonSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'Late Arrival - Flagged Absent' },
    { day: 30, status: 'PRESENT', subject: dbmsSubject, timeSlot: '09:00 AM - 10:30 AM', reason: 'On Time' },
    { day: 31, status: 'PRESENT', subject: osSubject, timeSlot: '11:00 AM - 12:30 PM', reason: 'On Time' },
  ];

  for (const item of JulyAttendanceList) {
    const sessionDate = new Date(2026, 6, item.day);
    const timeParts = item.timeSlot.split(' - ');
    const start = timeParts[0];
    const end = timeParts[1];

    const attSession = await prisma.attendanceSession.create({
      data: {
        collegeId: seniorCollege.id,
        academicSessionId: academicSession.id,
        subjectId: item.subject.id,
        teacherId: teacher.id,
        semesterId: semester.id,
        divisionId: division.id,
        lectureNumber: 1,
        attendanceDate: sessionDate,
        startTime: start,
        endTime: end,
        status: 'SUBMITTED',
      },
    });

    await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: attSession.id,
        studentId: student.id,
        status: item.status as any,
        remarks: item.reason,
        markedById: teacherUser.id,
        markedAt: new Date(2026, 6, item.day, 12, 0, 0),
      },
    });
  }

  // Seed initial log
  await prisma.activityLog.create({
    data: {
      userId: adminUser.id,
      userName: adminUser.name,
      role: 'ADMIN',
      action: 'Seeded initial database successfully',
      details: 'Created education group, colleges, departments, users, roles and students.',
    },
  });

  // Seed announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Semester Results Published for Batch 2026',
        content: 'The results for Semester 1 examinations have been published. Students can check their results on the student portal. For any discrepancies, contact the examination cell within 7 days.',
        category: 'Result',
        target: 'Entire College',
        status: 'PUBLISHED',
        priority: 'HIGH',
        publishedAt: new Date(),
        authorId: adminUser.id,
        collegeId: seniorCollege.id,
      },
      {
        title: 'Mid Semester Exam Timetable Updated',
        content: 'The mid-semester examination timetable for BSc IT Semester 3 has been updated. Please check the timetable section for the latest schedule.',
        category: 'Exam',
        target: 'BSc IT Semester 3',
        status: 'PUBLISHED',
        priority: 'NORMAL',
        publishedAt: new Date(Date.now() - 86400000),
        authorId: adminUser.id,
        collegeId: seniorCollege.id,
      },
      {
        title: 'Monsoon Holiday Announcement: Saturday Closed',
        content: 'Due to heavy rainfall forecast, the college will remain closed this Saturday. All scheduled classes and events are postponed to the next working day.',
        category: 'Holiday',
        target: 'Entire College',
        status: 'PUBLISHED',
        priority: 'HIGH',
        publishedAt: new Date(Date.now() - 5 * 86400000),
        authorId: adminUser.id,
        collegeId: seniorCollege.id,
      },
      {
        title: 'Maintenance Notice - Library Server Downtime',
        content: 'The library management system will undergo scheduled maintenance on 10th July from 10 PM to 6 AM. Digital resources will be temporarily unavailable.',
        category: 'Notice',
        target: 'Entire College',
        status: 'SCHEDULED',
        priority: 'NORMAL',
        scheduledAt: new Date(Date.now() + 2 * 86400000),
        authorId: adminUser.id,
        collegeId: seniorCollege.id,
      },
    ],
  });

  // Seed timetable for Division A
  const timetable = await prisma.timetable.create({
    data: {
      collegeId: seniorCollege.id,
      academicSessionId: academicSession.id,
      departmentId: department.id,
      courseId: course.id,
      semesterId: semester.id,
      divisionId: division.id,
      active: true,
    },
  });

  // Seed timetable slots for teacher Dr. Sarah Jenkins (teacher.id) and Division A
  // We will seed for every day of the week except Sunday: dayOfWeek 0 (Monday) to 5 (Saturday)
  const slotsData = [
    { dayOfWeek: 0, slotNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: dbmsSubject.id, room: 'Room 204' },
    { dayOfWeek: 0, slotNumber: 2, startTime: '10:15', endTime: '11:15', subjectId: osSubject.id, room: 'Room 103' },
    { dayOfWeek: 1, slotNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: dbmsSubject.id, room: 'Room 204' },
    { dayOfWeek: 1, slotNumber: 2, startTime: '10:15', endTime: '11:15', subjectId: osSubject.id, room: 'Room 103' },
    { dayOfWeek: 2, slotNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: dbmsSubject.id, room: 'Room 204' },
    { dayOfWeek: 2, slotNumber: 2, startTime: '10:15', endTime: '11:15', subjectId: osSubject.id, room: 'Room 103' },
    { dayOfWeek: 3, slotNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: dbmsSubject.id, room: 'Room 204' },
    { dayOfWeek: 3, slotNumber: 2, startTime: '10:15', endTime: '11:15', subjectId: osSubject.id, room: 'Room 103' },
    { dayOfWeek: 4, slotNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: dbmsSubject.id, room: 'Room 204' },
    { dayOfWeek: 4, slotNumber: 2, startTime: '10:15', endTime: '11:15', subjectId: osSubject.id, room: 'Room 103' },
    { dayOfWeek: 5, slotNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: dbmsSubject.id, room: 'Room 204' },
    { dayOfWeek: 5, slotNumber: 2, startTime: '10:15', endTime: '11:15', subjectId: osSubject.id, room: 'Room 103' },
  ];

  for (const s of slotsData) {
    await prisma.timetableSlot.create({
      data: {
        timetableId: timetable.id,
        dayOfWeek: s.dayOfWeek,
        slotNumber: s.slotNumber,
        startTime: s.startTime,
        endTime: s.endTime,
        subjectId: s.subjectId,
        teacherId: teacher.id,
        divisionId: division.id,
        room: s.room,
        isPublished: true,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
