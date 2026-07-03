import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollegesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.college.findMany({
      include: {
        departments: {
          include: {
            courses: {
              include: {
                academicSessions: true,
              },
            },
          },
        },
      },
    });
  }
}
