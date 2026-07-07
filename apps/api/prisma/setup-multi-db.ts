import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';

const colleges = ['college-a', 'college-b', 'college-c'];
const defaultPasswordHash = bcrypt.hashSync('password123', 10);

function getDatabaseUrl(collegeId: string): string {
  const defaultUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5444/campus-connect?schema=public';
  const parsed = new URL(defaultUrl);
  const dbName = `campus_connect_${collegeId.replace(/-/g, '_')}`;
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
}

async function createDatabaseIfNotExists(dbName: string) {
  const adminUrl = 'postgresql://postgres:postgrespassword@localhost:5444/postgres?schema=public';
  const client = new PrismaClient({
    datasources: { db: { url: adminUrl } }
  });
  
  try {
    await client.$executeRawUnsafe(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Created database: ${dbName}`);
  } catch (e: any) {
    if (e.message?.includes('already exists') || e.code === 'P2010') {
      console.log(`ℹ️ Database ${dbName} already exists`);
    } else {
      console.error(`❌ Failed to create database ${dbName}:`, e);
      throw e;
    }
  } finally {
    await client.$disconnect();
  }
}

async function seedCollegeDatabase(collegeId: string, url: string) {
  console.log(`🌱 Seeding database for ${collegeId}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    // 1. Clean existing records in reverse order
    await prisma.activityLog.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.loginHistory.deleteMany({});
    await prisma.roleModel.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.division.deleteMany({});
    await prisma.semester.deleteMany({});
    await prisma.academicSession.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.college.deleteMany({});
    await prisma.educationGroup.deleteMany({});

    // 2. Create Roles with Permissions
    const adminRole = await prisma.roleModel.create({
      data: {
        name: 'ADMIN',
        permissions: [
          'student.create',
          'student.update',
          'student.delete',
          'teacher.create',
          'teacher.update',
          'teacher.delete',
          'events.create',
          'announcements.create',
        ],
      },
    });

    const teacherRole = await prisma.roleModel.create({
      data: {
        name: 'TEACHER',
        permissions: ['notes.upload', 'events.create', 'announcements.create'],
      },
    });

    const studentRole = await prisma.roleModel.create({
      data: {
        name: 'STUDENT',
        permissions: ['notes.read'],
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

    // 5. Create Academic Hierarchy
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

    // 6. Create Users and Assign Roles specific to each college
    if (collegeId === 'college-a') {
      // Admin: Anish Patil
      await prisma.user.create({
        data: {
          email: 'anish@college.edu',
          passwordHash: defaultPasswordHash,
          name: 'Anish Patil',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: adminRole.id } },
        },
      });

      // Student: Alex Rivera
      const studentUser = await prisma.user.create({
        data: {
          email: 'student@collegea.edu',
          passwordHash: defaultPasswordHash,
          name: 'Alex Rivera',
          status: 'ACTIVE',
          collegeId: college.id,
          userRoles: { create: { roleId: studentRole.id } },
        },
      });

      await prisma.student.create({
        data: {
          userId: studentUser.id,
          divisionId: division.id,
          rollNumber: 'CS-2026-089',
          admissionNumber: 'ADM-902341',
          gender: 'Male',
          dateOfBirth: new Date('2005-05-15'),
          mobile: '+91 9876543210',
          address: '102, Shanti Nagar, Sector 4, Thane, Maharashtra',
          profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          parentName: 'Ramesh Rivera',
          parentMobile: '+91 9876543211',
          isActive: true,
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
        },
      });

      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          departments: { connect: [{ id: department.id }] },
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
        },
      });

      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          departments: { connect: [{ id: department.id }] },
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
        },
      });

      await prisma.student.create({
        data: {
          userId: studentUser.id,
          divisionId: division.id,
          rollNumber: 'CS-2026-104',
          admissionNumber: 'ADM-902359',
          gender: 'Female',
          dateOfBirth: new Date('2006-03-22'),
          mobile: '+91 9922334455',
          address: '501, Blue Heights, Lokhandwala, Andheri West, Mumbai',
          profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          parentName: 'Sunita Sharma',
          parentMobile: '+91 9922334466',
          isActive: true,
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
        },
      });

      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          departments: { connect: [{ id: department.id }] },
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
        },
      });

      await prisma.student.create({
        data: {
          userId: studentUser.id,
          divisionId: division.id,
          rollNumber: 'IT-2026-042',
          admissionNumber: 'ADM-902312',
          gender: 'Male',
          dateOfBirth: new Date('2005-09-10'),
          mobile: '+91 9811223344',
          address: '4B, Green Park View, Sector 2, Vashi, Navi Mumbai',
          profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          parentName: 'Vijay Kadam',
          parentMobile: '+91 9811223345',
          isActive: true,
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

  // 2. Push schema and seed each
  for (const collegeId of colleges) {
    const dbUrl = getDatabaseUrl(collegeId);
    console.log(`⚙️ Pushing Prisma schema to ${collegeId}...`);
    try {
      execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit',
      });
      console.log(`✅ Prisma schema pushed successfully for ${collegeId}.`);
    } catch (e) {
      console.error(`❌ Prisma schema push failed for ${collegeId}:`, e);
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
