import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        collegeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAllStudents() {
    return await this.prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            collegeId: true,
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
  }
}
