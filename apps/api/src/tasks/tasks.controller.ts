import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService, CreateTaskDto } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@ApiTags('Tasks Management')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create and assign a task to a teacher' })
  async create(@Req() req: any, @Body() dto: CreateTaskDto) {
    const user = req.user;
    const task = await this.tasksService.createTask(dto, user.id);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Created Task',
      `Assigned task "${dto.title}" to teacher ID ${dto.assignedToId}`,
    );

    return {
      success: true,
      message: 'Task created successfully',
      data: task,
    };
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve all tasks (Admin overview)' })
  async findAll() {
    const tasks = await this.tasksService.findAllTasks();
    return {
      success: true,
      message: 'All tasks retrieved successfully',
      data: tasks,
    };
  }

  @Get('assigned')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Retrieve tasks assigned to current teacher' })
  async findAssigned(@Req() req: any) {
    const teacher = req.user;
    const tasks = await this.tasksService.findAssignedTasks(teacher.id);
    return {
      success: true,
      message: 'Assigned tasks retrieved successfully',
      data: tasks,
    };
  }

  @Get('created')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve tasks created by current admin' })
  async findCreated(@Req() req: any) {
    const admin = req.user;
    const tasks = await this.tasksService.findCreatedTasks(admin.id);
    return {
      success: true,
      message: 'Created tasks retrieved successfully',
      data: tasks,
    };
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update completion status of a task' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'PENDING' | 'COMPLETED' },
  ) {
    const user = req.user;
    const task = await this.tasksService.updateTaskStatus(id, body.status);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Updated Task Status',
      `Updated task ${id} status to ${body.status}`,
    );

    return {
      success: true,
      message: 'Task status updated successfully',
      data: task,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a task' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    await this.tasksService.deleteTask(id);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Deleted Task',
      `Deleted task ID ${id}`,
    );

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Retrieve metrics summary of pending/completed tasks' })
  async getSummary(@Req() req: any) {
    const user = req.user;
    const summary = await this.tasksService.getSummary(user.id, user.role);
    return {
      success: true,
      message: 'Tasks summary retrieved successfully',
      data: summary,
    };
  }
}

