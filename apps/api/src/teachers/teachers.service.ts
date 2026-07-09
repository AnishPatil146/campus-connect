import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, SubjectAssignmentDto } from './dto/teacher.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { Role, TeacherEmploymentType, TeacherStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(dto: CreateTeacherDto, collegeId: string, actorId: string, actorName: string, actorRole: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existingUser) {
      throw new BadRequestException(`Email "${dto.email}" is already registered`);
    }

    // Verify main department exists in this college context
    const dbDep = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, collegeId, deletedAt: null },
    });
    if (!dbDep) {
      throw new NotFoundException(`Department with ID "${dto.departmentId}" not found in this college`);
    }

    const passwordHash = bcrypt.hashSync(dto.password || 'Welcome@123', 10);

    const teacher = await this.prisma.$transaction(async (tx) => {
      // 1. Create User with role and profile
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          collegeId,
          userRoles: {
            create: {
              role: {
                connect: { name: Role.TEACHER },
              },
            },
          },
          userProfile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              gender: dto.gender,
              phone: dto.phone || null,
            },
          },
        },
      });

      // Generate unique employee ID: TCH-YYYY-XXXX
      const year = new Date().getFullYear();
      const count = await tx.teacher.count();
      const countStr = String(count + 1).padStart(4, '0');
      const employeeId = `TCH-${year}-${countStr}`;

      // 2. Create Teacher
      const teacherObj = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          collegeId,
          departmentId: dto.departmentId,
          designation: dto.designation || 'Lecturer',
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
          employmentType: dto.employmentType as TeacherEmploymentType,
          status: 'ACTIVE',
          profile: {
            create: {
              firstName: dto.firstName,
              middleName: dto.middleName || null,
              lastName: dto.lastName,
              gender: dto.gender,
              dob: new Date(dto.dateOfBirth),
              phone: dto.phone || null,
              email: dto.email,
              bloodGroup: dto.bloodGroup || null,
              photo: dto.photo || null,
            },
          },
          departments: {
            create: {
              departmentId: dto.departmentId,
              primaryDepartment: true,
            },
          },
          workloads: {
            create: {
              subjectsCount: 0,
              weeklyHours: 0,
              lecturesCount: 0,
              labsCount: 0,
              totalCredits: 0,
            },
          },
        },
      });

      // 3. Create Qualification if passed
      if (dto.degree && dto.university) {
        await tx.teacherQualification.create({
          data: {
            teacherId: teacherObj.id,
            degree: dto.degree,
            university: dto.university,
            passingYear: dto.passingYear || 2015,
            percentage: dto.percentage || 100,
          },
        });
      }

      // 4. Create Address if passed
      if (dto.addressLine) {
        await tx.teacherAddress.create({
          data: {
            teacherId: teacherObj.id,
            addressLine: dto.addressLine,
            city: dto.city || 'Mumbai',
            state: dto.state || 'Maharashtra',
            country: dto.country || 'India',
            postalCode: dto.postalCode || '400001',
            addressType: dto.addressType || 'CURRENT',
          },
        });
      }

      // 5. Create Status History
      await tx.teacherStatusHistory.create({
        data: {
          teacherId: teacherObj.id,
          status: 'ACTIVE',
          changedBy: actorId,
          remarks: `Teacher admitted by ${actorName} (${actorRole})`,
        },
      });

      return teacherObj;
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Teacher Profile',
      `Created teacher account for ${dto.email} (Code: ${teacher.employeeId})`,
      'teachers',
      'Teacher',
      teacher.id,
    );

    this.eventsGateway.broadcast('teacher.created', { id: teacher.id, employeeId: teacher.employeeId });

    return teacher;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where: { deletedAt: null },
        include: {
          user: {
            select: { id: true, email: true, name: true, status: true },
          },
          profile: true,
          qualifications: true,
          addresses: true,
          workloads: true,
          departments: {
            include: {
              department: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          include: {
            userProfile: true,
          },
        },
        profile: true,
        qualifications: true,
        addresses: true,
        workloads: true,
        departments: {
          include: {
            department: true,
          },
        },
        subjects: {
          include: {
            subject: true,
            division: true,
            academicSession: true,
          },
        },
        leaves: true,
        histories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto, actorId: string, actorName: string, actorRole: string) {
    const teacher = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Update teacher main details
      const teacherData: any = {};
      if (dto.designation) teacherData.designation = dto.designation;
      if (dto.employmentType) teacherData.employmentType = dto.employmentType as TeacherEmploymentType;
      if (dto.status) teacherData.status = dto.status as TeacherStatus;

      await tx.teacher.update({
        where: { id },
        data: teacherData,
      });

      // 2. Update TeacherProfile
      const profileData: any = {};
      if (dto.firstName) profileData.firstName = dto.firstName;
      if (dto.lastName) profileData.lastName = dto.lastName;
      if (dto.phone) {
        profileData.phone = dto.phone;
        await tx.userProfile.update({
          where: { userId: teacher.userId },
          data: { phone: dto.phone },
        });
      }

      if (Object.keys(profileData).length > 0) {
        await tx.teacherProfile.update({
          where: { teacherId: id },
          data: profileData,
        });
      }

      // 3. Update User details
      const userData: any = {};
      if (dto.firstName || dto.lastName) {
        userData.name = `${dto.firstName || teacher.profile?.firstName || ''} ${dto.lastName || teacher.profile?.lastName || ''}`.trim();
      }
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: userData,
        });
      }

      // 4. Record status history if changed
      if (dto.status && dto.status !== teacher.status) {
        await tx.teacherStatusHistory.create({
          data: {
            teacherId: id,
            status: dto.status,
            changedBy: actorId,
            remarks: `Status updated to ${dto.status} by ${actorName}`,
          },
        });
      }
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated Teacher Profile',
      `Updated profile for teacher ID ${id}`,
      'teachers',
      'Teacher',
      id,
    );

    this.eventsGateway.broadcast('teacher.updated', { id });

    return this.findOne(id);
  }

  async remove(id: string, actorId: string, actorName: string, actorRole: string) {
    const teacher = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Soft delete Teacher Profile
      await tx.teacher.update({
        where: { id },
        data: {
          status: 'RETIRED',
          deletedAt: new Date(),
        },
      });

      // 2. Soft delete related User account
      await tx.user.update({
        where: { id: teacher.userId },
        data: { deletedAt: new Date() },
      });

      // 3. Terminate active user sessions
      await tx.session.updateMany({
        where: { userId: teacher.userId },
        data: { isActive: false },
      });

      // 4. Record status history
      await tx.teacherStatusHistory.create({
        data: {
          teacherId: id,
          status: 'RETIRED',
          changedBy: actorId,
          remarks: `Terminated and marked RETIRED by ${actorName}`,
        },
      });
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Deleted Teacher Profile',
      `Soft-deleted/retired teacher profile ID ${id}`,
      'teachers',
      'Teacher',
      id,
    );

    this.eventsGateway.broadcast('teacher.retired', { id, employeeId: teacher.employeeId });

    return { message: `Teacher profile "${teacher.employeeId}" soft-deleted and retired successfully` };
  }

  async assignSubjects(id: string, assignments: SubjectAssignmentDto[], actorId: string, actorName: string, actorRole: string) {
    const teacher = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Remove old assignments
      await tx.teacherSubject.deleteMany({
        where: { teacherId: id },
      });

      // 2. Create new assignments
      for (const assign of assignments) {
        await tx.teacherSubject.create({
          data: {
            teacherId: id,
            subjectId: assign.subjectId,
            divisionId: assign.divisionId,
            academicSessionId: assign.academicSessionId,
          },
        });
      }

      // 3. Recalculate workload
      const subjectsCount = new Set(assignments.map(a => a.subjectId)).size;
      const lecturesCount = assignments.length;
      const weeklyHours = lecturesCount * 3;
      const labsCount = 0;
      const totalCredits = subjectsCount * 4;

      await tx.teacherWorkload.deleteMany({
        where: { teacherId: id },
      });

      await tx.teacherWorkload.create({
        data: {
          teacherId: id,
          subjectsCount,
          weeklyHours,
          lecturesCount,
          labsCount,
          totalCredits,
        },
      });

      // 4. Record history log
      await tx.teacherStatusHistory.create({
        data: {
          teacherId: id,
          status: teacher.status,
          changedBy: actorId,
          remarks: `Reassigned subjects workload (Total subjects: ${subjectsCount}, weekly hours: ${weeklyHours})`,
        },
      });
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Assigned Subjects to Teacher',
      `Assigned ${assignments.length} subjects to teacher ID ${id}`,
      'teachers',
      'Teacher',
      id,
    );

    this.eventsGateway.broadcast('teacher.subjects_assigned', { id });

    return this.findOne(id);
  }

  // Request Leave System
  async requestLeave(id: string, leaveType: string, reason: string, startDate: string, endDate: string) {
    await this.findOne(id);

    const leave = await this.prisma.teacherLeave.create({
      data: {
        teacherId: id,
        leaveType,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'PENDING',
      },
    });

    this.eventsGateway.broadcast('teacher.leave_requested', { id, leaveId: leave.id });
    return leave;
  }

  // Approve Leave System
  async approveLeave(leaveId: string, actorId: string, actorName: string, actorRole: string) {
    const leave = await this.prisma.teacherLeave.findUnique({
      where: { id: leaveId },
    });
    if (!leave) {
      throw new NotFoundException(`Leave application with ID "${leaveId}" not found`);
    }

    const updatedLeave = await this.prisma.$transaction(async (tx) => {
      // 1. Update leave status
      const updated = await tx.teacherLeave.update({
        where: { id: leaveId },
        data: {
          status: 'APPROVED',
          approvedBy: actorId,
        },
      });

      // 2. Set teacher status to ON_LEAVE
      await tx.teacher.update({
        where: { id: leave.teacherId },
        data: {
          status: 'ON_LEAVE',
        },
      });

      // 3. Record status history
      await tx.teacherStatusHistory.create({
        data: {
          teacherId: leave.teacherId,
          status: 'ON_LEAVE',
          changedBy: actorId,
          remarks: `Leave approved by ${actorName} (${actorRole})`,
        },
      });

      return updated;
    });

    this.eventsGateway.broadcast('teacher.leave_approved', { id: leave.teacherId, leaveId });
    return updatedLeave;
  }
}
