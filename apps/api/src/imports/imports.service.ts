import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}

  // Resolve hierarchy strings to a Division ID
  private async resolveDivision(deptName: string, courseName: string, semName: string, divName: string) {
    // 1. Find department
    const department = await this.prisma.department.findFirst({
      where: { name: { equals: deptName.trim(), mode: 'insensitive' } },
    });
    if (!department) return null;

    // 2. Find course under department
    const course = await this.prisma.course.findFirst({
      where: {
        name: { equals: courseName.trim(), mode: 'insensitive' },
        departmentId: department.id,
      },
    });
    if (!course) return null;

    // 3. Find semester under course
    // Support formats like "1", "Semester 1", "Sem 1"
    const parsedSem = semName.trim().toLowerCase();
    const semNumber = parsedSem.replace(/\D/g, ''); // Extract digits (e.g. "Semester 1" -> "1")
    
    const semester = await this.prisma.semester.findFirst({
      where: {
        academicSession: { courseId: course.id },
        OR: [
          { name: { equals: semName.trim(), mode: 'insensitive' } },
          { name: { contains: semNumber ? `Semester ${semNumber}` : semName.trim(), mode: 'insensitive' } },
          { name: { contains: semNumber ? `Sem ${semNumber}` : semName.trim(), mode: 'insensitive' } },
        ]
      },
    });
    if (!semester) return null;

    // 4. Find division under semester
    // Support formats like "A", "Division A", "Div A"
    const parsedDiv = divName.trim().toLowerCase();
    const divLetter = parsedDiv.replace(/div(ision)?/g, '').trim().toUpperCase(); // Extract letter (e.g. "Division A" -> "A")

    const division = await this.prisma.division.findFirst({
      where: {
        semesterId: semester.id,
        OR: [
          { name: { equals: divName.trim(), mode: 'insensitive' } },
          { name: { contains: divLetter ? `Division ${divLetter}` : divName.trim(), mode: 'insensitive' } },
          { name: { contains: divLetter ? `Div ${divLetter}` : divName.trim(), mode: 'insensitive' } },
        ]
      },
    });
    return division;
  }

  // Resolve department by name
  private async resolveDepartment(deptName: string) {
    return await this.prisma.department.findFirst({
      where: { name: { equals: deptName.trim(), mode: 'insensitive' } },
    });
  }

  // Preview / Validate rows
  async previewImport(importType: 'STUDENT' | 'TEACHER', rows: any[]) {
    const previewResults: any[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      const warnings: string[] = [];
      const rowNum = i + 1;

      if (importType === 'STUDENT') {
        const name = row['Name'] || row['name'] || '';
        const email = row['Email'] || row['email'] || '';
        const rollNo = row['Roll No'] || row['Roll Number'] || row['rollNumber'] || row['roll_number'] || '';
        const mobile = row['Mobile'] || row['mobile'] || row['Phone'] || row['phone'] || '';
        const deptName = row['Department'] || row['department'] || '';
        const courseName = row['Course'] || row['course'] || '';
        const semName = row['Semester'] || row['semester'] || '';
        const divName = row['Division'] || row['division'] || '';

        // Validations
        if (!name.trim()) errors.push('Name is required');
        if (!email.trim()) {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          errors.push('Invalid email format');
        }

        let resolvedDiv = null;
        if (!deptName || !courseName || !semName || !divName) {
          errors.push('Academic fields (Department, Course, Semester, Division) are required');
        } else {
          resolvedDiv = await this.resolveDivision(deptName, courseName, semName, divName);
          if (!resolvedDiv) {
            errors.push(`Division "${divName}" not found in Semester "${semName}" for course "${courseName}"`);
          }
        }

        // Check duplicates in system
        if (email.trim()) {
          const userExists = await this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
          });
          if (userExists) {
            warnings.push(`Email "${email}" already registered (Duplicate account)`);
          }
        }

        if (rollNo.trim()) {
          const rollExists = await this.prisma.student.findFirst({
            where: { rollNumber: rollNo.trim(), deletedAt: null },
          });
          if (rollExists) {
            warnings.push(`Roll Number "${rollNo}" already exists in system`);
          }
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        previewResults.push({
          row: rowNum,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          rollNumber: rollNo.trim(),
          mobile: mobile.trim(),
          academicDetails: resolvedDiv 
            ? `${deptName.trim()} > ${courseName.trim()} (Sem ${semName.trim()}, Div ${divName.trim()})`
            : 'N/A',
          divisionId: resolvedDiv?.id || null,
          isValid,
          errors,
          warnings,
        });
      } else {
        // Teacher validations
        const empId = row['Employee ID'] || row['EmployeeId'] || row['employee_id'] || '';
        const name = row['Name'] || row['name'] || '';
        const email = row['Email'] || row['email'] || '';
        const deptName = row['Department'] || row['department'] || '';
        const phone = row['Phone'] || row['phone'] || row['Mobile'] || row['mobile'] || '';

        if (!name.trim()) errors.push('Name is required');
        if (!email.trim()) {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          errors.push('Invalid email format');
        }

        let resolvedDept = null;
        if (!deptName) {
          errors.push('Department is required');
        } else {
          resolvedDept = await this.resolveDepartment(deptName);
          if (!resolvedDept) {
            errors.push(`Department "${deptName}" not found`);
          }
        }

        if (email.trim()) {
          const userExists = await this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
          });
          if (userExists) {
            warnings.push(`Email "${email}" already registered`);
          }
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        previewResults.push({
          row: rowNum,
          employeeId: empId.trim(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: phone.trim(),
          department: deptName.trim(),
          departmentId: resolvedDept?.id || null,
          isValid,
          errors,
          warnings,
        });
      }
    }

    return {
      totalFound: rows.length,
      validCount,
      errorCount,
      preview: previewResults,
    };
  }

  // Commit validation and create accounts
  async commitImport(
    importType: 'STUDENT' | 'TEACHER',
    rows: any[],
    duplicatePolicy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW',
    importedById: string,
    filename: string,
  ) {
    let successRows = 0;
    let failedRows = 0;
    const errorDetails: any[] = [];

    const defaultPasswordHash = bcrypt.hashSync('Campus@123', 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      
      try {
        if (importType === 'STUDENT') {
          const name = row.name || row.Name || '';
          const email = (row.email || row.Email || '').trim().toLowerCase();
          const rollNumber = row.rollNumber || row.roll_number || row.rollNo || '';
          const mobile = row.mobile || row.Phone || '';
          const divisionId = row.divisionId;

          if (!name || !email || !divisionId) {
            throw new Error('Missing required student columns');
          }

          // Resolve division first so we have required academic relation IDs
          const division = await this.prisma.division.findUnique({
            where: { id: divisionId },
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
            throw new Error(`Division with ID "${divisionId}" not found`);
          }

          const collegeId = division.semester.academicSession.course.department.collegeId;
          const departmentId = division.semester.academicSession.course.departmentId;
          const courseId = division.semester.academicSession.courseId;
          const semesterId = division.semesterId;
          const academicSessionId = division.semester.academicSessionId;

          // Check duplicate email
          const existingUser = await this.prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            if (duplicatePolicy === 'SKIP') {
              successRows++; // count as successful skip
              continue;
            } else if (duplicatePolicy === 'OVERWRITE') {
              // Update User and Student profile
              await this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: { name },
                });

                const student = await tx.student.findUnique({
                  where: { userId: existingUser.id },
                });

                if (student) {
                  await tx.student.update({
                    where: { id: student.id },
                    data: {
                      divisionId,
                      rollNumber,
                    },
                  });

                  await tx.studentProfile.upsert({
                    where: { studentId: student.id },
                    update: { phone: mobile || null },
                    create: {
                      studentId: student.id,
                      firstName: name.split(' ')[0] || 'Student',
                      lastName: name.split(' ').slice(1).join(' ') || 'Profile',
                      gender: 'MALE',
                      dob: new Date(),
                      phone: mobile || null,
                      email,
                    },
                  });
                } else {
                  // If User exists but doesn't have Student profile, create one
                  await tx.student.create({
                    data: {
                      userId: existingUser.id,
                      collegeId,
                      departmentId,
                      courseId,
                      semesterId,
                      divisionId,
                      academicSessionId,
                      rollNumber,
                      admissionNo: `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      admissionDate: new Date(),
                      currentYear: 1,
                      status: 'ACTIVE',
                      profile: {
                        create: {
                          firstName: name.split(' ')[0] || 'Student',
                          lastName: name.split(' ').slice(1).join(' ') || 'Profile',
                          gender: 'MALE',
                          dob: new Date(),
                          phone: mobile || null,
                          email,
                        },
                      },
                    },
                  });
                }
              });
              successRows++;
              continue;
            } else {
              throw new Error(`Email "${email}" is already registered (Duplicate policy: CREATE_NEW failed due to unique constraints)`);
            }
          }

          // Create brand new User + Student in transaction
          await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email,
                name,
                passwordHash: defaultPasswordHash,
                status: 'ACTIVE',
                userRoles: {
                  create: {
                    role: {
                      connect: { name: Role.STUDENT },
                    },
                  },
                },
                collegeId,
              },
            });

            await tx.student.create({
              data: {
                userId: user.id,
                collegeId,
                departmentId,
                courseId,
                semesterId,
                divisionId,
                academicSessionId,
                rollNumber,
                admissionNo: `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                admissionDate: new Date(),
                currentYear: 1,
                status: 'ACTIVE',
                profile: {
                  create: {
                    firstName: name.split(' ')[0] || 'Student',
                    lastName: name.split(' ').slice(1).join(' ') || 'Profile',
                    gender: 'MALE',
                    dob: new Date(),
                    phone: mobile || null,
                    email,
                  },
                },
              },
            });
          });
          successRows++;
        } else {
          // Teacher importing logic
          const name = row.name || row.Name || '';
          const email = (row.email || row.Email || '').trim().toLowerCase();
          const departmentId = row.departmentId;

          if (!name || !email || !departmentId) {
            throw new Error('Missing required teacher columns');
          }

          // Resolve department and college ID
          const dept = await this.prisma.department.findUnique({
            where: { id: departmentId },
          });
          if (!dept) {
            throw new Error(`Department with ID "${departmentId}" not found`);
          }
          const collegeId = dept.collegeId;

          const existingUser = await this.prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            if (duplicatePolicy === 'SKIP') {
              successRows++;
              continue;
            } else if (duplicatePolicy === 'OVERWRITE') {
              await this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: { name },
                });

                const teacher = await tx.teacher.findUnique({
                  where: { userId: existingUser.id },
                });

                if (teacher) {
                  // Connect to the new department if not connected via join table
                  const existingTD = await tx.teacherDepartment.findFirst({
                    where: { teacherId: teacher.id, departmentId },
                  });
                  if (!existingTD) {
                    await tx.teacherDepartment.create({
                      data: {
                        teacherId: teacher.id,
                        departmentId,
                        primaryDepartment: false,
                      },
                    });
                  }
                } else {
                  const year = new Date().getFullYear();
                  const count = await tx.teacher.count();
                  const countStr = String(count + 1).padStart(4, '0');
                  const employeeId = `TCH-${year}-${countStr}`;

                  await tx.teacher.create({
                    data: {
                      userId: existingUser.id,
                      employeeId,
                      collegeId,
                      departmentId,
                      designation: 'Lecturer',
                      joiningDate: new Date(),
                      employmentType: 'FULL_TIME',
                      status: 'ACTIVE',
                      profile: {
                        create: {
                          firstName: name.split(' ')[0] || 'Teacher',
                          lastName: name.split(' ').slice(1).join(' ') || 'Profile',
                          gender: 'MALE',
                          dob: new Date(),
                          email: existingUser.email,
                        },
                      },
                      departments: {
                        create: {
                          departmentId,
                          primaryDepartment: true,
                        },
                      },
                    },
                  });
                }
              });
              successRows++;
              continue;
            } else {
              throw new Error(`Email "${email}" already registered`);
            }
          }

          await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email,
                name,
                passwordHash: defaultPasswordHash,
                status: 'ACTIVE',
                userRoles: {
                  create: {
                    role: {
                      connect: { name: Role.TEACHER },
                    },
                  },
                },
                collegeId,
              },
            });

            const year = new Date().getFullYear();
            const count = await tx.teacher.count();
            const countStr = String(count + 1).padStart(4, '0');
            const employeeId = `TCH-${year}-${countStr}`;

            await tx.teacher.create({
              data: {
                userId: user.id,
                employeeId,
                collegeId,
                departmentId,
                designation: 'Lecturer',
                joiningDate: new Date(),
                employmentType: 'FULL_TIME',
                status: 'ACTIVE',
                profile: {
                  create: {
                    firstName: name.split(' ')[0] || 'Teacher',
                    lastName: name.split(' ').slice(1).join(' ') || 'Profile',
                    gender: 'MALE',
                    dob: new Date(),
                    email,
                  },
                },
                departments: {
                  create: {
                    departmentId,
                    primaryDepartment: true,
                  },
                },
              },
            });
          });
          successRows++;
        }
      } catch (err: any) {
        failedRows++;
        errorDetails.push({
          row: rowNum,
          name: row.name || row.Name || 'Unknown',
          email: row.email || row.Email || 'N/A',
          error: err.message || 'Unknown processing error',
        });
      }
    }

    const finalStatus = failedRows === 0 ? 'COMPLETED' : successRows === 0 ? 'FAILED' : 'PARTIAL';

    // Save record to ImportHistory
    const history = await this.prisma.importHistory.create({
      data: {
        filename,
        importType,
        totalRows: rows.length,
        successRows,
        failedRows,
        status: finalStatus,
        errorReport: errorDetails.length > 0 ? JSON.stringify(errorDetails) : null,
        importedById,
      },
    });

    return {
      historyId: history.id,
      successRows,
      failedRows,
      status: finalStatus,
      errors: errorDetails,
    };
  }

  // Get past imports history
  async getHistory() {
    return await this.prisma.importHistory.findMany({
      include: {
        importedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true,
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

  // Promote all students from source division to target division
  async promoteDivision(sourceDivId: string, targetDivId: string, failedStudentIds: string[]) {
    // Verify target division exists
    const targetDivision = await this.prisma.division.findUnique({
      where: { id: targetDivId },
    });
    if (!targetDivision) {
      throw new NotFoundException(`Target division with ID "${targetDivId}" not found`);
    }

    // Verify source division exists
    const sourceDivision = await this.prisma.division.findUnique({
      where: { id: sourceDivId },
    });
    if (!sourceDivision) {
      throw new NotFoundException(`Source division with ID "${sourceDivId}" not found`);
    }

    // Execute promotion inside a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Find all students in source division
      const students = await tx.student.findMany({
        where: { divisionId: sourceDivId, deletedAt: null },
      });

      let promotedCount = 0;
      let skippedCount = 0;

      for (const student of students) {
        if (failedStudentIds.includes(student.id)) {
          skippedCount++;
          continue; // Kept in current semester/division due to backlog
        }

        await tx.student.update({
          where: { id: student.id },
          data: { divisionId: targetDivId },
        });
        promotedCount++;
      }

      return {
        total: students.length,
        promotedCount,
        skippedCount,
      };
    });
  }
}
