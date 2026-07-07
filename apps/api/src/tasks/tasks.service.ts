import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate: string;
  assignedToId: string;
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async createTask(dto: CreateTaskDto, createdById: string) {
    return await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        assignedToId: dto.assignedToId,
        createdById: createdById,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllTasks() {
    return await this.prisma.task.findMany({
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAssignedTasks(teacherId: string) {
    return await this.prisma.task.findMany({
      where: { assignedToId: teacherId },
      orderBy: { dueDate: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findCreatedTasks(adminId: string) {
    return await this.prisma.task.findMany({
      where: { createdById: adminId },
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateTaskStatus(taskId: string, status: 'PENDING' | 'COMPLETED') {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return await this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  }

  async deleteTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async getSummary(userId: string, role: string) {
    if (role === 'ADMIN') {
      const total = await this.prisma.task.count();
      const completed = await this.prisma.task.count({ where: { status: 'COMPLETED' } });
      const pending = total - completed;
      return { total, completed, pending };
    } else {
      const total = await this.prisma.task.count({ where: { assignedToId: userId } });
      const completed = await this.prisma.task.count({ where: { assignedToId: userId, status: 'COMPLETED' } });
      const pending = total - completed;
      return { total, completed, pending };
    }
  }
}
