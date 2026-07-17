import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';

const colleges = ['college-a', 'college-b', 'college-c'];
const defaultPasswordHash = bcrypt.hashSync('password123', 10);

function getEnvCaseInsensitive(key: string): string | undefined {
  const upperKey = key.toUpperCase();
  for (const envKey of Object.keys(process.env)) {
    if (envKey.toUpperCase() === upperKey) {
      return process.env[envKey];
    }
  }
  return undefined;
}

function getDatabaseUrl(collegeId: string): string {
  const cleanId = collegeId.replace('college-', '').toUpperCase().replace(/-/g, '_');
  const fullId = collegeId.toUpperCase().replace(/-/g, '_');

  const keys = [
    `COLLEGE_${cleanId}_DATABASE_URL`,
    `DATABASE_${cleanId}_URL`,
    `COLLEGE_${fullId}_DATABASE_URL`,
    `DATABASE_${fullId}_URL`,
  ];

  for (const key of keys) {
    const url = getEnvCaseInsensitive(key);
    if (url) {
      return url;
    }
  }

  // Fallback
  const defaultUrl = process.env.DATABASE_URL || process.env.MASTER_DATABASE_URL || process.env.DATABASE_MASTER_URL || 'postgresql://postgres:postgrespassword@localhost:5444/campus-connect?schema=public';
  const parsed = new URL(defaultUrl);
  const dbName = `campus_connect_${collegeId.replace(/-/g, '_')}`;
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
}

async function createDatabaseIfNotExists(dbName: string) {
  // Since we are using production/explicit environment database URLs, the database is already created.
  console.log(`ℹ️ Skipping CREATE DATABASE for ${dbName} (explicit DB url is configured in environment).`);
}

async function seedCollegeDatabase(collegeId: string, url: string) {
  console.log(`🌱 Seeding database for ${collegeId}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    // 1. Clean existing records in reverse order
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

    // 2. Create Permissions
    const modules = [
      'auth', 'users', 'roles', 'colleges', 'education-groups', 'departments',
      'courses', 'subjects', 'students', 'teachers', 'attendance', 'timetable',
      'notes', 'assignments', 'events', 'announcements', 'notifications',
      'reports', 'analytics', 'audit', 'backup', 'dashboard'
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

    // ADMIN Role
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

    // 4. Create College matching this ID
    let collegeName = '';
    if (collegeId === 'college-a') {
      collegeName = "Pushpalata Mhatre Women's College of Arts, Commerce & Science";
    } else if (collegeId === 'college-b') {
      collegeName = 'Balasaheb Mhatre College of Science (Junior)';
    } else {
      collegeName = 'Balasaheb Mhatre College of Science (Senior)';
    }

    const college = await prisma.college.create({
      data: {
        id: collegeId,
        name: collegeName,
        educationGroupId: educationGroup.id,
      },
    });

    // Create default settings
    await prisma.collegeSetting.create({
      data: { collegeId: college.id },
    });

    // 5. Create basic departments/courses/semesters/divisions hierarchy
    const department = await prisma.department.create({
      data: {
        name: 'Computer Science',
        collegeId: college.id,
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

    // 6. Seed Specific College Users & Profiles
    if (collegeId === 'college-a') {
      // Student for College A
      const studentUser = await prisma.user.create({
        data: {
          email: 'student@collegea.edu',
          passwordHash: defaultPasswordHash,
          name: 'Alex Rivera',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: studentRole.id } },
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

      await prisma.student.create({
        data: {
          userId: studentUser.id,
          collegeId: college.id,
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
              email: 'student@collegea.edu',
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
        },
      });

      // Admin for College A
      await prisma.user.create({
        data: {
          email: 'admin@collegea.edu',
          passwordHash: defaultPasswordHash,
          name: 'College A Admin',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: adminRole.id } },
          userProfile: {
            create: {
              firstName: 'Admin',
              lastName: 'A',
              phone: '+91 9900990098',
            },
          },
        },
      });

      // HOD Admin for College A
      await prisma.user.create({
        data: {
          email: 'admin@collegea.com',
          passwordHash: defaultPasswordHash,
          name: 'College A HOD',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: adminRole.id } },
          userProfile: {
            create: {
              firstName: 'HOD',
              lastName: 'A',
              phone: '+91 9900990097',
            },
          },
        },
      });

      // Teacher: Dr. Sarah Jenkins (fallback/mock support)
      const teacherUser = await prisma.user.create({
        data: {
          email: 'teacher@collegea.edu',
          passwordHash: defaultPasswordHash,
          name: 'Dr. Sarah Jenkins',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: {
            createMany: {
              data: [{ roleId: teacherRole.id }, { roleId: adminRole.id }]
            }
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

      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          employeeId: 'TCH-2026-0001',
          collegeId: college.id,
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
              email: 'teacher@collegea.edu',
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

    } else if (collegeId === 'college-b') {
      // Teacher: Dr. Sarah Jenkins
      const teacherUser = await prisma.user.create({
        data: {
          email: 'teacher@collegeb.edu',
          passwordHash: defaultPasswordHash,
          name: 'Dr. Sarah Jenkins',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: {
            createMany: {
              data: [{ roleId: teacherRole.id }, { roleId: adminRole.id }]
            }
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

      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          employeeId: 'TCH-2026-0001',
          collegeId: college.id,
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
              email: 'teacher@collegeb.edu',
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

      // Admin for College B
      await prisma.user.create({
        data: {
          email: 'admin@collegeb.edu',
          passwordHash: defaultPasswordHash,
          name: 'College B Admin',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: adminRole.id } },
          userProfile: {
            create: {
              firstName: 'Admin',
              lastName: 'B',
              phone: '+91 9900990099',
            },
          },
        },
      });

      // Student for College B
      const studentUser = await prisma.user.create({
        data: {
          email: 'student@collegeb.edu',
          passwordHash: defaultPasswordHash,
          name: 'Priya Sharma',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: studentRole.id } },
          userProfile: {
            create: {
              firstName: 'Priya',
              lastName: 'Sharma',
              phone: '+91 9922334455',
              address: '501, Blue Heights, Lokhandwala, Andheri West, Mumbai',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
            },
          },
        },
      });

      await prisma.student.create({
        data: {
          userId: studentUser.id,
          collegeId: college.id,
          departmentId: department.id,
          courseId: course.id,
          semesterId: semester.id,
          divisionId: division.id,
          academicSessionId: academicSession.id,
          admissionNo: 'ADM-902359',
          rollNumber: 'CS-2026-104',
          admissionDate: new Date(),
          currentYear: 1,
          profile: {
            create: {
              firstName: 'Priya',
              lastName: 'Sharma',
              gender: 'Female',
              dob: new Date('2006-03-22'),
              email: 'student@collegeb.edu',
              phone: '+91 9922334455',
              photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            },
          },
          guardians: {
            create: {
              motherName: 'Sunita Sharma',
              phone: '+91 9922334466',
            },
          },
          addresses: {
            create: {
              addressLine: '501, Blue Heights, Lokhandwala, Andheri West',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              postalCode: '400053',
              addressType: 'CURRENT',
            },
          },
        },
      });

    } else {
      // college-c
      // Admin: College C Admin
      await prisma.user.create({
        data: {
          email: 'admin@collegec.edu',
          passwordHash: defaultPasswordHash,
          name: 'Senior College Admin',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: adminRole.id } },
          userProfile: {
            create: {
              firstName: 'Admin',
              lastName: 'C',
              phone: '+91 9911991199',
            },
          },
        },
      });

      // Teacher
      const teacherUser = await prisma.user.create({
        data: {
          email: 'teacher@collegec.edu',
          passwordHash: defaultPasswordHash,
          name: 'Prof. Amit Patil',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: teacherRole.id } },
          userProfile: {
            create: {
              firstName: 'Amit',
              lastName: 'Patil',
              phone: '+91 9811223399',
            },
          },
        },
      });

      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          employeeId: 'TCH-2026-0002',
          collegeId: college.id,
          departmentId: department.id,
          joiningDate: new Date(),
          employmentType: 'FULL_TIME',
          profile: {
            create: {
              firstName: 'Amit',
              lastName: 'Patil',
              gender: 'Male',
              dob: new Date('1980-08-15'),
              phone: '+91 9811223399',
              email: 'teacher@collegec.edu',
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

      // Student
      const studentUser = await prisma.user.create({
        data: {
          email: 'student@collegec.edu',
          passwordHash: defaultPasswordHash,
          name: 'Rohit Kadam',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: studentRole.id } },
          userProfile: {
            create: {
              firstName: 'Rohit',
              lastName: 'Kadam',
              phone: '+91 9811223344',
              address: '4B, Green Park View, Sector 2, Vashi, Navi Mumbai',
              city: 'Navi Mumbai',
              state: 'Maharashtra',
              country: 'India',
            },
          },
        },
      });

      await prisma.student.create({
        data: {
          userId: studentUser.id,
          collegeId: college.id,
          departmentId: department.id,
          courseId: course.id,
          semesterId: semester.id,
          divisionId: division.id,
          academicSessionId: academicSession.id,
          admissionNo: 'ADM-902312',
          rollNumber: 'IT-2026-042',
          admissionDate: new Date(),
          currentYear: 1,
          profile: {
            create: {
              firstName: 'Rohit',
              lastName: 'Kadam',
              gender: 'Male',
              dob: new Date('2005-09-10'),
              email: 'student@collegec.edu',
              phone: '+91 9811223344',
              photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            },
          },
          guardians: {
            create: {
              fatherName: 'Vijay Kadam',
              phone: '+91 9811223345',
            },
          },
          addresses: {
            create: {
              addressLine: '4B, Green Park View, Sector 2',
              city: 'Vashi',
              state: 'Maharashtra',
              country: 'India',
              postalCode: '400703',
              addressType: 'CURRENT',
            },
          },
        },
      });
    }

    console.log(`✅ Seeded database for ${collegeId} successfully.`);
  } catch (e) {
    console.error(`❌ Failed to seed database for ${collegeId}:`, e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  console.log('🏁 Starting multi-tenant database setup...');
  
  // 1. Create databases
  for (const collegeId of colleges) {
    const dbName = `campus_connect_${collegeId.replace(/-/g, '_')}`;
    await createDatabaseIfNotExists(dbName);
  }

  // 2. Deploy schema migrations and seed each
  for (const collegeId of colleges) {
    const dbUrl = getDatabaseUrl(collegeId);
    console.log(`⚙️ Running Prisma db push on ${collegeId}...`);
    try {
      execSync('npx prisma db push --accept-data-loss --schema=prisma/schema_merged.prisma', {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit',
      });
      console.log(`✅ Prisma db push completed successfully for ${collegeId}.`);
    } catch (e) {
      console.error(`❌ Prisma migrations deployment failed for ${collegeId}:`, e);
      process.exit(1);
    }

    // Seed database
    await seedCollegeDatabase(collegeId, dbUrl);
  }

  console.log('🎉 Multi-tenant database setup completed successfully!');
}

run().catch(err => {
  console.error('💥 Setup execution failed:', err);
  process.exit(1);
});
