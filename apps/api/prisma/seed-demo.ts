import { PrismaClient, Role, UserStatus, StudentStatus, TeacherStatus, TeacherEmploymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDemoAccounts() {
  console.log('🚀 Starting safe, idempotent Demo Accounts seeding for Neon database...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Ensure System Roles exist
  const roles = [
    { name: Role.ADMIN, description: 'College administrator with full access' },
    { name: Role.TEACHER, description: 'Faculty member' },
    { name: Role.STUDENT, description: 'Enrolled student' },
  ];

  const roleMap = new Map<Role, string>();
  for (const r of roles) {
    const roleRecord = await prisma.roleModel.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        description: r.description,
        isSystem: true,
      },
    });
    roleMap.set(r.name, roleRecord.id);
  }

  // 2. Ensure Education Group & Senior College exist
  let educationGroup = await prisma.educationGroup.findFirst({
    where: { name: 'Balasaheb Mhatre Education Group' },
  });
  if (!educationGroup) {
    educationGroup = await prisma.educationGroup.create({
      data: { name: 'Balasaheb Mhatre Education Group' },
    });
  }

  let seniorCollege = await prisma.college.findFirst({
    where: { name: 'Balasaheb Mhatre College of Science (Senior)' },
  });
  if (!seniorCollege) {
    seniorCollege = await prisma.college.create({
      data: {
        name: 'Balasaheb Mhatre College of Science (Senior)',
        educationGroupId: educationGroup.id,
      },
    });
  }

  // Ensure College Settings exist
  await prisma.collegeSetting.upsert({
    where: { collegeId: seniorCollege.id },
    update: {},
    create: { collegeId: seniorCollege.id },
  });

  // 3. Ensure Academic Hierarchy exists
  const department = await prisma.department.upsert({
    where: {
      name_collegeId: {
        name: 'Computer Science',
        collegeId: seniorCollege.id,
      },
    },
    update: {},
    create: {
      name: 'Computer Science',
      collegeId: seniorCollege.id,
    },
  });

  const course = await prisma.course.upsert({
    where: {
      name_departmentId: {
        name: 'BSc IT',
        departmentId: department.id,
      },
    },
    update: {},
    create: {
      name: 'BSc IT',
      departmentId: department.id,
    },
  });

  const academicSession = await prisma.academicSession.upsert({
    where: {
      name_courseId: {
        name: '2026-27',
        courseId: course.id,
      },
    },
    update: {},
    create: {
      name: '2026-27',
      courseId: course.id,
      isActive: true,
    },
  });

  const semester = await prisma.semester.upsert({
    where: {
      name_academicSessionId: {
        name: 'Semester 1',
        academicSessionId: academicSession.id,
      },
    },
    update: {},
    create: {
      name: 'Semester 1',
      academicSessionId: academicSession.id,
      number: 1,
    },
  });

  const division = await prisma.division.upsert({
    where: {
      name_semesterId: {
        name: 'Division A',
        semesterId: semester.id,
      },
    },
    update: {},
    create: {
      name: 'Division A',
      semesterId: semester.id,
    },
  });

  // 4. Ensure Subjects exist
  const dbmsSubject = await prisma.subject.upsert({
    where: {
      code_courseId: {
        code: 'CS-401',
        courseId: course.id,
      },
    },
    update: { name: 'Database Management Systems', creditHours: 4 },
    create: {
      name: 'Database Management Systems',
      code: 'CS-401',
      courseId: course.id,
      departmentId: department.id,
      creditHours: 4,
    },
  });

  const osSubject = await prisma.subject.upsert({
    where: {
      code_courseId: {
        code: 'CS-402',
        courseId: course.id,
      },
    },
    update: { name: 'Operating Systems', creditHours: 4 },
    create: {
      name: 'Operating Systems',
      code: 'CS-402',
      courseId: course.id,
      departmentId: department.id,
      creditHours: 4,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. DEMO USER 1: ADMIN (admin.demo@campusconnect.demo)
  // ──────────────────────────────────────────────────────────────────────────
  const adminEmail = 'admin.demo@campusconnect.demo';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin Demo User',
      passwordHash,
      status: UserStatus.ACTIVE,
      collegeId: seniorCollege.id,
    },
    create: {
      email: adminEmail,
      name: 'Admin Demo User',
      passwordHash,
      status: UserStatus.ACTIVE,
      collegeId: seniorCollege.id,
      userProfile: {
        create: {
          firstName: 'Admin',
          lastName: 'Demo',
          phone: '+91 9876543200',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      },
    },
  });

  // Ensure Admin Role assigned
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: roleMap.get(Role.ADMIN)!,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: roleMap.get(Role.ADMIN)!,
    },
  });
  console.log(`✅ Admin Demo account ready: ${adminEmail}`);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. DEMO USER 2: TEACHER (teacher.demo@campusconnect.demo)
  // ──────────────────────────────────────────────────────────────────────────
  const teacherEmail = 'teacher.demo@campusconnect.demo';
  const teacherUser = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {
      name: 'Dr. Teacher Demo',
      passwordHash,
      status: UserStatus.ACTIVE,
      collegeId: seniorCollege.id,
    },
    create: {
      email: teacherEmail,
      name: 'Dr. Teacher Demo',
      passwordHash,
      status: UserStatus.ACTIVE,
      collegeId: seniorCollege.id,
      userProfile: {
        create: {
          firstName: 'Teacher',
          lastName: 'Demo',
          phone: '+91 9876543201',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      },
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: teacherUser.id,
        roleId: roleMap.get(Role.TEACHER)!,
      },
    },
    update: {},
    create: {
      userId: teacherUser.id,
      roleId: roleMap.get(Role.TEACHER)!,
    },
  });

  // Ensure Teacher Profile Record exists
  let teacherRecord = await prisma.teacher.findUnique({
    where: { userId: teacherUser.id },
  });
  if (!teacherRecord) {
    teacherRecord = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        employeeId: 'TCH-DEMO-2026',
        collegeId: seniorCollege.id,
        departmentId: department.id,
        joiningDate: new Date('2024-01-15'),
        employmentType: TeacherEmploymentType.FULL_TIME,
        status: TeacherStatus.ACTIVE,
        profile: {
          create: {
            firstName: 'Teacher',
            lastName: 'Demo',
            gender: 'Female',
            dob: new Date('1988-06-20'),
            email: teacherEmail,
            phone: '+91 9876543201',
          },
        },
      },
    });
  }
  console.log(`✅ Teacher Demo account ready: ${teacherEmail}`);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. DEMO USER 3: STUDENT (student.demo@campusconnect.demo)
  // ──────────────────────────────────────────────────────────────────────────
  const studentEmail = 'student.demo@campusconnect.demo';
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      name: 'Student Demo User',
      passwordHash,
      status: UserStatus.ACTIVE,
      collegeId: seniorCollege.id,
    },
    create: {
      email: studentEmail,
      name: 'Student Demo User',
      passwordHash,
      status: UserStatus.ACTIVE,
      collegeId: seniorCollege.id,
      userProfile: {
        create: {
          firstName: 'Student',
          lastName: 'Demo',
          phone: '+91 9876543202',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
      },
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: studentUser.id,
        roleId: roleMap.get(Role.STUDENT)!,
      },
    },
    update: {},
    create: {
      userId: studentUser.id,
      roleId: roleMap.get(Role.STUDENT)!,
    },
  });

  // Ensure Student Profile Record exists
  let studentRecord = await prisma.student.findUnique({
    where: { userId: studentUser.id },
  });
  if (!studentRecord) {
    studentRecord = await prisma.student.create({
      data: {
        userId: studentUser.id,
        collegeId: seniorCollege.id,
        departmentId: department.id,
        courseId: course.id,
        semesterId: semester.id,
        divisionId: division.id,
        academicSessionId: academicSession.id,
        admissionNo: 'ADM-DEMO-2026',
        rollNumber: 'CS-DEMO-001',
        admissionDate: new Date('2025-07-01'),
        currentYear: 1,
        status: StudentStatus.ACTIVE,
        profile: {
          create: {
            firstName: 'Student',
            lastName: 'Demo',
            gender: 'Male',
            dob: new Date('2006-03-10'),
            email: studentEmail,
            phone: '+91 9876543202',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
        },
        guardians: {
          create: {
            fatherName: 'Mr. Guardian Demo',
            phone: '+91 9876543299',
          },
        },
        addresses: {
          create: {
            addressLine: 'Campus Hostel Block B',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            postalCode: '400001',
            addressType: 'CURRENT',
          },
        },
      },
    });
  }
  console.log(`✅ Student Demo account ready: ${studentEmail}`);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Timetable & Schedule for Division A and Teacher Demo
  // ──────────────────────────────────────────────────────────────────────────
  let timetable = await prisma.timetable.findFirst({
    where: { divisionId: division.id, active: true },
  });
  if (!timetable) {
    timetable = await prisma.timetable.create({
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
  }

  // Ensure slots exist across the week (days 0-5 = Mon-Sat) for Teacher Demo
  const existingSlotsCount = await prisma.timetableSlot.count({
    where: { timetableId: timetable.id, teacherId: teacherRecord.id },
  });

  if (existingSlotsCount === 0) {
    const slots = [
      { dayOfWeek: 0, slotNumber: 3, startTime: '11:30', endTime: '12:30', subjectId: dbmsSubject.id, room: 'Room 201' },
      { dayOfWeek: 0, slotNumber: 4, startTime: '13:30', endTime: '14:30', subjectId: osSubject.id, room: 'Room 102' },
      { dayOfWeek: 1, slotNumber: 3, startTime: '11:30', endTime: '12:30', subjectId: dbmsSubject.id, room: 'Room 201' },
      { dayOfWeek: 1, slotNumber: 4, startTime: '13:30', endTime: '14:30', subjectId: osSubject.id, room: 'Room 102' },
      { dayOfWeek: 2, slotNumber: 3, startTime: '11:30', endTime: '12:30', subjectId: dbmsSubject.id, room: 'Room 201' },
      { dayOfWeek: 2, slotNumber: 4, startTime: '13:30', endTime: '14:30', subjectId: osSubject.id, room: 'Room 102' },
      { dayOfWeek: 3, slotNumber: 3, startTime: '11:30', endTime: '12:30', subjectId: dbmsSubject.id, room: 'Room 201' },
      { dayOfWeek: 3, slotNumber: 4, startTime: '13:30', endTime: '14:30', subjectId: osSubject.id, room: 'Room 102' },
      { dayOfWeek: 4, slotNumber: 3, startTime: '11:30', endTime: '12:30', subjectId: dbmsSubject.id, room: 'Room 201' },
      { dayOfWeek: 4, slotNumber: 4, startTime: '13:30', endTime: '14:30', subjectId: osSubject.id, room: 'Room 102' },
      { dayOfWeek: 5, slotNumber: 3, startTime: '11:30', endTime: '12:30', subjectId: dbmsSubject.id, room: 'Room 201' },
      { dayOfWeek: 5, slotNumber: 4, startTime: '13:30', endTime: '14:30', subjectId: osSubject.id, room: 'Room 102' },
    ];

    for (const s of slots) {
      const existingSlot = await prisma.timetableSlot.findFirst({
        where: {
          timetableId: timetable.id,
          divisionId: division.id,
          dayOfWeek: s.dayOfWeek,
          slotNumber: s.slotNumber,
        },
      });

      if (!existingSlot) {
        await prisma.timetableSlot.create({
          data: {
            timetableId: timetable.id,
            dayOfWeek: s.dayOfWeek,
            slotNumber: s.slotNumber,
            startTime: s.startTime,
            endTime: s.endTime,
            subjectId: s.subjectId,
            teacherId: teacherRecord.id,
            divisionId: division.id,
            room: s.room,
            isPublished: true,
          },
        });
      }
    }
    console.log('✅ Timetable slots seeded for Teacher Demo and Division A');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Attendance Sessions & Records for Student Demo
  // ──────────────────────────────────────────────────────────────────────────
  const studentAttendanceCount = await prisma.attendanceRecord.count({
    where: { studentId: studentRecord.id },
  });

  if (studentAttendanceCount === 0) {
    const today = new Date();
    for (let i = 1; i <= 15; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const session = await prisma.attendanceSession.create({
        data: {
          collegeId: seniorCollege.id,
          academicSessionId: academicSession.id,
          subjectId: dbmsSubject.id,
          teacherId: teacherRecord.id,
          semesterId: semester.id,
          divisionId: division.id,
          lectureNumber: 1,
          attendanceDate: d,
          startTime: '09:00',
          endTime: '10:00',
          status: 'SUBMITTED',
        },
      });

      await prisma.attendanceRecord.create({
        data: {
          attendanceSessionId: session.id,
          studentId: studentRecord.id,
          status: i % 7 === 0 ? 'ABSENT' : 'PRESENT',
          remarks: i % 7 === 0 ? 'Unexcused Absence' : 'Present on time',
          markedById: teacherUser.id,
          markedAt: d,
        },
      });
    }
    console.log('✅ 15 attendance records seeded for Student Demo');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Sample Notes uploaded by Teacher Demo
  // ──────────────────────────────────────────────────────────────────────────
  const teacherNotesCount = await prisma.note.count({
    where: { teacherId: teacherRecord.id },
  });

  if (teacherNotesCount === 0) {
    let noteCategory = await prisma.noteCategory.findFirst({
      where: { name: 'Lecture Notes' },
    });
    if (!noteCategory) {
      noteCategory = await prisma.noteCategory.create({
        data: { name: 'Lecture Notes' },
      });
    }

    await prisma.note.create({
      data: {
        teacherId: teacherRecord.id,
        subjectId: dbmsSubject.id,
        semesterId: semester.id,
        divisionId: division.id,
        categoryId: noteCategory.id,
        title: 'Unit 1: Relational Algebra & SQL Foundations',
        description: 'Comprehensive lecture slides and reference questions for Unit 1.',
        status: 'PUBLISHED',
        visibility: 'SEMESTER',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'DBMS_Unit1_Notes.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
      },
    });

    await prisma.note.create({
      data: {
        teacherId: teacherRecord.id,
        subjectId: osSubject.id,
        semesterId: semester.id,
        divisionId: division.id,
        categoryId: noteCategory.id,
        title: 'Unit 2: Process Scheduling & Concurrency',
        description: 'Detailed CPU scheduling algorithms, Gantt charts, and race conditions.',
        status: 'PUBLISHED',
        visibility: 'SEMESTER',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'OS_Unit2_Concurrency.pdf',
        fileSize: 2097152,
        mimeType: 'application/pdf',
      },
    });
    console.log('✅ Lecture notes seeded for Teacher Demo');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Announcements (College-wide)
  // ──────────────────────────────────────────────────────────────────────────
  const announcementCount = await prisma.announcement.count({
    where: { collegeId: seniorCollege.id },
  });

  if (announcementCount === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: 'Welcome to Campus Connect Academic Session 2026-27',
          content: 'All faculty and students are welcomed to the unified Campus Connect portal. Real-time timetables, grades, and attendance tracking are now active.',
          category: 'General',
          target: 'Entire College',
          status: 'PUBLISHED',
          priority: 'HIGH',
          publishedAt: new Date(),
          authorId: adminUser.id,
          collegeId: seniorCollege.id,
        },
        {
          title: 'Internal Assessment Submission Schedule',
          content: 'Internal assignments for Semester 1 will be due next Friday. Submit submissions directly via the Student Portal.',
          category: 'Exam',
          target: 'BSc IT Semester 1',
          status: 'PUBLISHED',
          priority: 'NORMAL',
          publishedAt: new Date(),
          authorId: teacherUser.id,
          collegeId: seniorCollege.id,
        },
      ],
    });
    console.log('✅ College announcements seeded');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Upcoming Events
  // ──────────────────────────────────────────────────────────────────────────
  const eventCount = await prisma.event.count({
    where: { collegeId: seniorCollege.id },
  });

  if (eventCount === 0) {
    const eventStartDate = new Date();
    eventStartDate.setDate(eventStartDate.getDate() + 7);
    const eventEndDate = new Date(eventStartDate);
    eventEndDate.setHours(eventEndDate.getHours() + 4);

    await prisma.event.create({
      data: {
        collegeId: seniorCollege.id,
        createdById: adminUser.id,
        title: 'Annual Science & Technology Symposium 2026',
        description: 'Inter-collegiate tech conference featuring keynotes on AI in Education and Cloud Computing.',
        venue: 'Auditorium Hall A',
        startDatetime: eventStartDate,
        endDatetime: eventEndDate,
        status: 'PUBLISHED',
        registrationRequired: true,
      },
    });
    console.log('✅ Upcoming event seeded');
  }

  console.log('\n🎉 Demo Accounts Seeding Completed Successfully!\n');
  console.log('====================================================');
  console.log('STUDENT DEMO: student.demo@campusconnect.demo / password123');
  console.log('TEACHER DEMO: teacher.demo@campusconnect.demo / password123');
  console.log('ADMIN DEMO:   admin.demo@campusconnect.demo   / password123');
  console.log('====================================================\n');
}

if (require.main === module) {
  seedDemoAccounts()
    .catch((e) => {
      console.error('❌ Error during demo seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
