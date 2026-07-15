import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Role, StudentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(collegeId?: string, query?: {
    search?: string;
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    divisionId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (collegeId) {
      where.collegeId = collegeId;
    }

    if (query?.status === 'deleted') {
      where.deletedAt = { not: null };
    } else if (query?.status) {
      where.deletedAt = null;
      where.status = query.status as StudentStatus;
    } else {
      where.deletedAt = null;
      where.status = 'ACTIVE';
    }

    if (query?.divisionId) {
      where.divisionId = query.divisionId;
    } else if (query?.semesterId) {
      where.semesterId = query.semesterId;
    } else if (query?.courseId) {
      where.courseId = query.courseId;
    } else if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.search) {
      const searchVal = query.search.trim();
      where.OR = [
        { user: { name: { contains: searchVal, mode: 'insensitive' } } },
        { user: { email: { contains: searchVal, mode: 'insensitive' } } },
        { rollNumber: { contains: searchVal, mode: 'insensitive' } },
        { admissionNo: { contains: searchVal, mode: 'insensitive' } },
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
            createdAt: true,
          },
        },
        profile: true,
        guardians: true,
        addresses: true,
        medical: true,
        promotions: true,
        logins: true,
        statusHistories: true,
        division: {
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
            collegeId: true,
          },
        },
        profile: true,
        guardians: true,
        addresses: true,
        medical: true,
        promotions: true,
        logins: true,
        statusHistories: true,
        division: {
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
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    if (collegeId && student.collegeId !== collegeId) {
      throw new BadRequestException('Access denied: Student belongs to another college');
    }

    return student;
  }

  async findByUserId(userId: string, collegeId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            collegeId: true,
          },
        },
        profile: true,
        guardians: true,
        addresses: true,
        medical: true,
      },
    });

    if (!student) {
      return null;
    }

    if (collegeId && student.collegeId !== collegeId) {
      throw new BadRequestException('Access denied: Student belongs to another college');
    }

    return student;
  }

  async create(createDto: CreateStudentDto, collegeId: string | null, actorId: string, actorName: string, actorRole: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new BadRequestException(`Email "${createDto.email}" is already registered`);
    }

    // Generate dynamic values if not supplied
    const resolvedCollegeId = collegeId || createDto.collegeId;
    const admissionNo = createDto.admissionNo || `ADM-${resolvedCollegeId.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const rollNumber = createDto.rollNumber || `CS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // Verify roll number uniqueness in the division
    const existingRoll = await this.prisma.student.findFirst({
      where: { rollNumber, divisionId: createDto.divisionId, deletedAt: null },
    });
    if (existingRoll) {
      throw new BadRequestException(`Roll number "${rollNumber}" already exists in this division`);
    }

    const defaultPasswordHash = bcrypt.hashSync('password123', 12);

    const student = await this.prisma.$transaction(async (tx) => {
      // 1. Create User
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
          collegeId: resolvedCollegeId,
          userProfile: {
            create: {
              firstName: createDto.firstName,
              lastName: createDto.lastName,
              gender: createDto.gender,
              phone: createDto.phone || null,
            },
          },
        },
      });

      // 2. Create Student (Academic details)
      const studentObj = await tx.student.create({
        data: {
          userId: user.id,
          collegeId: resolvedCollegeId,
          departmentId: createDto.departmentId,
          courseId: createDto.courseId,
          semesterId: createDto.semesterId,
          divisionId: createDto.divisionId,
          academicSessionId: createDto.academicSessionId,
          admissionNo,
          rollNumber,
          registrationNumber: createDto.registrationNumber || null,
          admissionDate: createDto.admissionDate ? new Date(createDto.admissionDate) : new Date(),
          currentYear: createDto.currentYear || 1,
          status: 'ACTIVE',
          profile: {
            create: {
              firstName: createDto.firstName,
              middleName: createDto.middleName || null,
              lastName: createDto.lastName,
              gender: createDto.gender,
              dob: new Date(createDto.dateOfBirth),
              bloodGroup: createDto.bloodGroup || null,
              religion: createDto.religion || null,
              nationality: createDto.nationality || 'Indian',
              aadharNumber: createDto.aadharNumber || null,
              passportNumber: createDto.passportNumber || null,
              photoUrl: createDto.photoUrl || null,
              email: createDto.email,
              phone: createDto.phone || null,
            },
          },
          guardians: {
            create: {
              fatherName: createDto.fatherName || null,
              motherName: createDto.motherName || null,
              guardianName: createDto.guardianName || null,
              relationship: createDto.guardianRelationship || null,
              occupation: createDto.guardianOccupation || null,
              phone: createDto.guardianPhone || null,
              email: createDto.guardianEmail || null,
              annualIncome: createDto.guardianAnnualIncome || null,
            },
          },
          addresses: {
            create: {
              addressLine: createDto.addressLine || 'N/A',
              city: createDto.city || 'Thane',
              state: createDto.state || 'Maharashtra',
              country: createDto.country || 'India',
              postalCode: createDto.postalCode || '400601',
              addressType: createDto.addressType || 'CURRENT',
            },
          },
          medical: {
            create: {
              bloodGroup: createDto.bloodGroup || null,
              allergies: createDto.allergies || null,
              medicalNotes: createDto.medicalNotes || null,
              disability: createDto.disability || null,
              insurance: createDto.insurance || null,
            },
          },
        },
      });

      // 3. Create status history
      await tx.studentStatusHistory.create({
        data: {
          studentId: studentObj.id,
          status: 'ADMISSION',
          changedBy: actorId,
          remarks: `Admitted by ${actorName} (${actorRole})`,
        },
      });

      return studentObj;
    });

    this.eventsGateway.broadcast('student.created', { id: student.id, name: createDto.name });
    return student;
  }

  async update(id: string, updateDto: UpdateStudentDto, collegeId?: string) {
    const student = await this.findOne(id, collegeId);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update Student Table (Academic fields)
      const studentData: any = {};
      if (updateDto.divisionId) studentData.divisionId = updateDto.divisionId;
      if (updateDto.rollNumber) studentData.rollNumber = updateDto.rollNumber;
      if (updateDto.admissionNo) studentData.admissionNo = updateDto.admissionNo;
      if (updateDto.registrationNumber !== undefined) studentData.registrationNumber = updateDto.registrationNumber;
      if (updateDto.admissionDate) studentData.admissionDate = new Date(updateDto.admissionDate);
      if (updateDto.currentYear !== undefined) studentData.currentYear = updateDto.currentYear;
      if (updateDto.status) studentData.status = updateDto.status as StudentStatus;

      await tx.student.update({
        where: { id },
        data: studentData,
      });

      // 2. Update StudentProfile
      const profileData: any = {};
      if (updateDto.firstName) profileData.firstName = updateDto.firstName;
      if (updateDto.middleName !== undefined) profileData.middleName = updateDto.middleName;
      if (updateDto.lastName) profileData.lastName = updateDto.lastName;
      if (updateDto.gender) profileData.gender = updateDto.gender;
      if (updateDto.dateOfBirth) profileData.dob = new Date(updateDto.dateOfBirth);
      if (updateDto.bloodGroup !== undefined) profileData.bloodGroup = updateDto.bloodGroup;
      if (updateDto.religion !== undefined) profileData.religion = updateDto.religion;
      if (updateDto.nationality) profileData.nationality = updateDto.nationality;
      if (updateDto.aadharNumber !== undefined) profileData.aadharNumber = updateDto.aadharNumber;
      if (updateDto.passportNumber !== undefined) profileData.passportNumber = updateDto.passportNumber;
      if (updateDto.photoUrl !== undefined) profileData.photoUrl = updateDto.photoUrl;
      if (updateDto.phone !== undefined) profileData.phone = updateDto.phone;

      if (Object.keys(profileData).length > 0) {
        await tx.studentProfile.update({
          where: { studentId: id },
          data: profileData,
        });
      }

      // 3. Update User Name
      if (updateDto.name) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: updateDto.name },
        });
      }

      // 4. Update status history if status changed
      if (updateDto.status && updateDto.status !== student.status) {
        await tx.studentStatusHistory.create({
          data: {
            studentId: id,
            status: updateDto.status,
            changedBy: 'SYSTEM_ADMIN',
            remarks: 'Status updated by admin',
          },
        });
      }

      // 5. Update/Create Guardian details
      const guardianData: any = {};
      if (updateDto.fatherName !== undefined) guardianData.fatherName = updateDto.fatherName;
      if (updateDto.motherName !== undefined) guardianData.motherName = updateDto.motherName;
      if (updateDto.guardianName !== undefined) guardianData.guardianName = updateDto.guardianName;
      if (updateDto.guardianRelationship !== undefined) guardianData.guardianRelationship = updateDto.guardianRelationship;
      if (updateDto.guardianOccupation !== undefined) guardianData.guardianOccupation = updateDto.guardianOccupation;
      if (updateDto.guardianPhone !== undefined) guardianData.guardianPhone = updateDto.guardianPhone;
      if (updateDto.guardianEmail !== undefined) guardianData.guardianEmail = updateDto.guardianEmail;
      if (updateDto.guardianAnnualIncome !== undefined) guardianData.guardianAnnualIncome = updateDto.guardianAnnualIncome;

      if (Object.keys(guardianData).length > 0) {
        const existingGuardian = await tx.studentGuardian.findFirst({
          where: { studentId: id },
        });
        if (existingGuardian) {
          await tx.studentGuardian.update({
            where: { id: existingGuardian.id },
            data: guardianData,
          });
        } else {
          await tx.studentGuardian.create({
            data: {
              ...guardianData,
              studentId: id,
            },
          });
        }
      }

      // 6. Update/Create Address details
      const addressData: any = {};
      if (updateDto.addressLine !== undefined) addressData.addressLine = updateDto.addressLine;
      if (updateDto.city !== undefined) addressData.city = updateDto.city;
      if (updateDto.state !== undefined) addressData.state = updateDto.state;
      if (updateDto.country !== undefined) addressData.country = updateDto.country;
      if (updateDto.postalCode !== undefined) addressData.postalCode = updateDto.postalCode;
      if (updateDto.addressType !== undefined) addressData.addressType = updateDto.addressType;

      if (Object.keys(addressData).length > 0) {
        const existingAddress = await tx.studentAddress.findFirst({
          where: { studentId: id },
        });
        if (existingAddress) {
          await tx.studentAddress.update({
            where: { id: existingAddress.id },
            data: addressData,
          });
        } else {
          await tx.studentAddress.create({
            data: {
              ...addressData,
              studentId: id,
            },
          });
        }
      }

      // 7. Update/Create Medical details
      const medicalData: any = {};
      if (updateDto.allergies !== undefined) medicalData.allergies = updateDto.allergies;
      if (updateDto.medicalNotes !== undefined) medicalData.medicalNotes = updateDto.medicalNotes;
      if (updateDto.disability !== undefined) medicalData.disability = updateDto.disability;
      if (updateDto.insurance !== undefined) medicalData.insurance = updateDto.insurance;
      if (updateDto.bloodGroup !== undefined) medicalData.bloodGroup = updateDto.bloodGroup;

      if (Object.keys(medicalData).length > 0) {
        const existingMedical = await tx.studentMedical.findFirst({
          where: { studentId: id },
        });
        if (existingMedical) {
          await tx.studentMedical.update({
            where: { id: existingMedical.id },
            data: medicalData,
          });
        } else {
          await tx.studentMedical.create({
            data: {
              ...medicalData,
              studentId: id,
            },
          });
        }
      }

      return await tx.student.findUnique({
        where: { id },
        include: {
          profile: true,
          guardians: true,
          addresses: true,
          medical: true,
        },
      });
    });
  }

  async softDelete(id: string, collegeId?: string) {
    await this.findOne(id, collegeId);

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: {
          status: 'INACTIVE',
          deletedAt: new Date(),
        },
      });

      await tx.studentStatusHistory.create({
        data: {
          studentId: id,
          status: 'INACTIVE',
          changedBy: 'SYSTEM_ADMIN',
          remarks: 'Student record soft-deleted',
        },
      });

      return updated;
    });
  }

  async resetPassword(id: string, collegeId?: string, customPassword?: string) {
    const student = await this.findOne(id, collegeId);
    const passwordToUse = customPassword || 'password123';
    const passwordHash = bcrypt.hashSync(passwordToUse, 12);

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
        : 'Password reset to default "password123"',
    };
  }

  async promote(studentIds: string[], targetDivisionId: string, actorId: string, actorName: string, actorRole: string) {
    const targetDivision = await this.prisma.division.findUnique({
      where: { id: targetDivisionId, deletedAt: null },
      include: {
        semester: true,
      },
    });
    if (!targetDivision) {
      throw new NotFoundException(`Target Division with ID "${targetDivisionId}" not found`);
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, deletedAt: null },
    });

    if (students.length === 0) {
      throw new BadRequestException('No valid student profiles provided for promotion');
    }

    return await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const student of students) {
        const previousDivisionId = student.divisionId;

        if (previousDivisionId === targetDivisionId) {
          results.push(student);
          continue;
        }

        const updated = await tx.student.update({
          where: { id: student.id },
          data: {
            divisionId: targetDivisionId,
            semesterId: targetDivision.semesterId,
          },
        });

        // Create student promotion log
        await tx.studentPromotion.create({
          data: {
            studentId: student.id,
            oldSemester: student.semesterId,
            newSemester: targetDivision.semesterId,
            oldDivision: previousDivisionId,
            newDivision: targetDivisionId,
            promotedBy: actorId,
          },
        });

        // Create status history log
        await tx.studentStatusHistory.create({
          data: {
            studentId: student.id,
            status: 'PROMOTION',
            changedBy: actorId,
            remarks: `Promoted to division ${targetDivision.name} by ${actorName} (${actorRole})`,
          },
        });

        this.eventsGateway.broadcast('student.promoted', { id: student.id, targetDivisionId });
        results.push(updated);
      }
      return results;
    });
  }
}
