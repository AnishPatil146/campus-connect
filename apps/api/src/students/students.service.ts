import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(collegeId?: string, query?: {
    search?: string;
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    divisionId?: string;
    status?: string;
  }) {
    const where: any = {};

    // Scope to specific college if collegeId is provided (e.g. for College Admins)
    if (collegeId) {
      where.user = { collegeId };
    }

    // Status filtering
    if (query?.status === 'deleted') {
      where.deletedAt = { not: null };
    } else if (query?.status === 'inactive') {
      where.deletedAt = null;
      where.isActive = false;
    } else {
      // Default to showing only non-deleted, active students
      where.deletedAt = null;
      where.isActive = true;
    }

    // Dynamic academic filtering
    if (query?.divisionId) {
      where.divisionId = query.divisionId;
    } else if (query?.semesterId) {
      where.division = { semesterId: query.semesterId };
    } else if (query?.courseId) {
      where.division = { semester: { academicSession: { courseId: query.courseId } } };
    } else if (query?.departmentId) {
      where.division = { semester: { academicSession: { course: { departmentId: query.departmentId } } } };
    }

    // Search query
    if (query?.search) {
      const searchVal = query.search.trim();
      where.OR = [
        { user: { name: { contains: searchVal, mode: 'insensitive' } } },
        { user: { email: { contains: searchVal, mode: 'insensitive' } } },
        { rollNumber: { contains: searchVal, mode: 'insensitive' } },
        { admissionNumber: { contains: searchVal, mode: 'insensitive' } },
      ];
    }

    return await this.prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            collegeId: true,
            createdAt: true,
          },
        },
        division: {
          include: {
            semester: {
              include: {
                academicSession: {
                  include: {
                    course: {
                      include: {
                        department: {
                          include: {
                            college: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, collegeId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            collegeId: true,
          },
        },
        division: {
          include: {
            semester: {
              include: {
                academicSession: {
                  include: {
                    course: {
                      include: {
                        department: {
                          include: {
                            college: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    if (collegeId && (student as any).user.collegeId !== collegeId) {
      throw new BadRequestException('Access denied: Student belongs to another college');
    }

    return student;
  }

  async create(createDto: CreateStudentDto, collegeId: string | null) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new BadRequestException(`Email "${createDto.email}" is already registered`);
    }

    // Find the division to ensure it exists
    const division = await this.prisma.division.findUnique({
      where: { id: createDto.divisionId },
      include: {
        semester: {
          include: {
            academicSession: {
              include: {
                course: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!division) {
      throw new NotFoundException(`Division with ID "${createDto.divisionId}" not found`);
    }

    // Determine the college ID of the student.
    // If collegeId is enforced via controller (e.g. College Admin), verify it matches the division's college.
    const divisionCollegeId = division.semester.academicSession.course.department.collegeId;
    const targetCollegeId = collegeId || divisionCollegeId;

    if (collegeId && divisionCollegeId !== collegeId) {
      throw new BadRequestException('Cannot create student in a division of another college');
    }

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the User record
      const user = await tx.user.create({
        data: {
          email: createDto.email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          name: createDto.name,
          status: 'ACTIVE',
          userRoles: {
            create: {
              role: {
                connect: { name: Role.STUDENT },
              },
            },
          },
          collegeId: targetCollegeId,
        },
      });

      // 2. Create the Student record
      const student = await tx.student.create({
        data: {
          userId: user.id,
          divisionId: createDto.divisionId,
          rollNumber: createDto.rollNumber || null,
          admissionNumber: createDto.admissionNumber || null,
          gender: createDto.gender || null,
          dateOfBirth: createDto.dateOfBirth ? new Date(createDto.dateOfBirth) : null,
          mobile: createDto.mobile || null,
          address: createDto.address || null,
          profilePhoto: createDto.profilePhoto || null,
          parentName: createDto.parentName || null,
          parentMobile: createDto.parentMobile || null,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              userRoles: {
                select: {
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              collegeId: true,
            },
          },
        },
      });

      return student;
    });
  }

  async update(id: string, updateDto: UpdateStudentDto, collegeId?: string) {
    const student = await this.findOne(id, collegeId);

    // Verify division if changed
    if (updateDto.divisionId && updateDto.divisionId !== student.divisionId) {
      const division = await this.prisma.division.findUnique({
        where: { id: updateDto.divisionId },
        include: {
          semester: {
            include: {
              academicSession: {
                include: {
                  course: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!division) {
        throw new NotFoundException(`Division with ID "${updateDto.divisionId}" not found`);
      }

      if (collegeId && division.semester.academicSession.course.department.collegeId !== collegeId) {
        throw new BadRequestException('Cannot transfer student to a division in another college');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update the User details if name is provided
      if (updateDto.name) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: updateDto.name },
        });
      }

      // 2. Update Student details
      const studentData: any = {};
      if (updateDto.divisionId !== undefined) studentData.divisionId = updateDto.divisionId;
      if (updateDto.rollNumber !== undefined) studentData.rollNumber = updateDto.rollNumber;
      if (updateDto.admissionNumber !== undefined) studentData.admissionNumber = updateDto.admissionNumber;
      if (updateDto.gender !== undefined) studentData.gender = updateDto.gender;
      if (updateDto.dateOfBirth !== undefined) {
        studentData.dateOfBirth = updateDto.dateOfBirth ? new Date(updateDto.dateOfBirth) : null;
      }
      if (updateDto.mobile !== undefined) studentData.mobile = updateDto.mobile;
      if (updateDto.address !== undefined) studentData.address = updateDto.address;
      if (updateDto.profilePhoto !== undefined) studentData.profilePhoto = updateDto.profilePhoto;
      if (updateDto.parentName !== undefined) studentData.parentName = updateDto.parentName;
      if (updateDto.parentMobile !== undefined) studentData.parentMobile = updateDto.parentMobile;
      if (updateDto.isActive !== undefined) studentData.isActive = updateDto.isActive;

      const updated = await tx.student.update({
        where: { id },
        data: studentData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              userRoles: {
                select: {
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              collegeId: true,
            },
          },
        },
      });

      return updated;
    });
  }

  async softDelete(id: string, collegeId?: string) {
    await this.findOne(id, collegeId);
    
    return await this.prisma.student.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async resetPassword(id: string, collegeId?: string, customPassword?: string) {
    const student = await this.findOne(id, collegeId);
    const passwordToUse = customPassword || 'password123';
    const passwordHash = bcrypt.hashSync(passwordToUse, 10);
    
    await this.prisma.user.update({
      where: { id: student.userId },
      data: {
        passwordHash,
      },
    });

    return { 
      success: true, 
      message: customPassword 
        ? 'Password updated to custom value successfully' 
        : 'Password reset to default "password123"' 
    };
  }
}
