import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records in reverse order of dependencies
  await prisma.activityLog.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.division.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.academicSession.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.college.deleteMany({});
  await prisma.educationGroup.deleteMany({});

  // 2. Create Education Group
  const educationGroup = await prisma.educationGroup.create({
    data: {
      name: 'Balasaheb Mhatre Education Group',
    },
  });

  // 3. Create Colleges
  await prisma.college.create({
    data: {
      name: "Pushpalata Mhatre Women's College",
      educationGroupId: educationGroup.id,
    },
  });

  await prisma.college.create({
    data: {
      name: 'Balasaheb Mhatre Junior College',
      educationGroupId: educationGroup.id,
    },
  });

  const seniorCollege = await prisma.college.create({
    data: {
      name: 'Balasaheb Mhatre Senior College',
      educationGroupId: educationGroup.id,
    },
  });

  // 4. Create hierarchy in Balasaheb Mhatre Senior College
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

  // 5. Create Users
  // Super Admin
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@campusconnect.com',
      passwordHash: defaultPasswordHash,
      name: 'System Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  // College Admin for Balasaheb Mhatre Senior College
  await prisma.user.create({
    data: {
      email: 'collegeadmin@college.edu',
      passwordHash: defaultPasswordHash,
      name: 'Balasaheb Admin',
      role: Role.COLLEGE_ADMIN,
      collegeId: seniorCollege.id,
    },
  });

  // Teacher Profile
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@college.edu',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Sarah Jenkins',
      role: Role.TEACHER,
      collegeId: seniorCollege.id,
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
      role: Role.STUDENT,
      collegeId: seniorCollege.id,
    },
  });

  await prisma.student.create({
    data: {
      userId: studentUser.id,
      divisionId: division.id,
    },
  });

  // Seed initial log
  await prisma.activityLog.create({
    data: {
      userId: superAdminUser.id,
      userName: superAdminUser.name,
      role: superAdminUser.role,
      action: 'Seeded initial database successfully',
      details: 'Created education group, colleges, departments, users, and students.',
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
