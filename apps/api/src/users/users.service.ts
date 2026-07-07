import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        collegeId: true,
        createdAt: true,
        updatedAt: true,
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
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.userRoles[0]?.role.name || null,
      roles: u.userRoles.map((ur) => ur.role.name),
      collegeId: u.collegeId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  async findAllStudents() {
    const students = await this.prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            collegeId: true,
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
        division: {
          include: {
            semester: {
              include: {
                academicSession: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return students.map((s) => {
      const u = s.user;
      return {
        ...s,
        user: u
          ? {
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.userRoles[0]?.role.name || null,
              roles: u.userRoles.map((ur) => ur.role.name),
              collegeId: u.collegeId,
            }
          : null,
      };
    });
  }
}
