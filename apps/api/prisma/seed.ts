import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records in reverse order of dependencies
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
    },
  });

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      departments: {
        connect: [{ id: department.id }],
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
