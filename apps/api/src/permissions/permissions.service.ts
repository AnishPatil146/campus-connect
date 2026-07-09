import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all permissions, grouped by module.
   */
  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group by module
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return {
      total: permissions.length,
      modules: Object.keys(grouped).map((module) => ({
        module,
        permissions: grouped[module].map((p) => ({
          id: p.id,
          name: p.name,
          action: p.action,
          description: p.description,
        })),
      })),
    };
  }

  /**
   * Get permissions for a specific module.
   */
  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module },
      orderBy: { action: 'asc' },
    });
  }

  /**
   * Check if a user has specific permissions via their active role.
   */
  async checkUserPermissions(userId: string, permissionNames: string[]) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Collect all user permissions from all roles
    const allPermissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        allPermissions.add(rp.permission.name);
      }
    }

    // Check requested permissions
    const result = permissionNames.map((name) => ({
      permission: name,
      granted: allPermissions.has(name),
    }));

    return {
      userId,
      permissions: result,
      allGranted: result.every((r) => r.granted),
    };
  }

  /**
   * Seed default permissions on app startup.
   * Idempotent — only creates permissions that don't exist yet.
   */
  async seedDefaultPermissions() {
    const modules = [
      'auth',
      'users',
      'roles',
      'colleges',
      'education-groups',
      'departments',
      'courses',
      'subjects',
      'students',
      'teachers',
      'attendance',
      'timetable',
      'notes',
      'assignments',
      'events',
      'announcements',
      'notifications',
      'reports',
      'analytics',
      'audit',
      'backup',
      'dashboard',
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    const permissionsToCreate: { name: string; module: string; action: string; description: string }[] = [];

    for (const mod of modules) {
      for (const action of actions) {
        permissionsToCreate.push({
          name: `${mod}.${action}`,
          module: mod,
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod}`,
        });
      }
    }

    // Add special permissions
    permissionsToCreate.push(
      { name: 'roles.assign', module: 'roles', action: 'assign', description: 'Assign or remove roles from users' },
      { name: 'backup.restore', module: 'backup', action: 'restore', description: 'Restore from backup' },
      { name: 'students.import', module: 'students', action: 'import', description: 'Import students via CSV' },
      { name: 'students.export', module: 'students', action: 'export', description: 'Export students data' },
      { name: 'teachers.import', module: 'teachers', action: 'import', description: 'Import teachers via CSV' },
      { name: 'teachers.export', module: 'teachers', action: 'export', description: 'Export teachers data' },
      { name: 'attendance.mark', module: 'attendance', action: 'mark', description: 'Mark student attendance' },
      { name: 'attendance.report', module: 'attendance', action: 'report', description: 'View attendance reports' },
      { name: 'announcements.publish', module: 'announcements', action: 'publish', description: 'Publish announcements' },
      { name: 'events.register', module: 'events', action: 'register', description: 'Register for events' },
      { name: 'audit.export', module: 'audit', action: 'export', description: 'Export audit logs' },
    );

    let created = 0;
    for (const perm of permissionsToCreate) {
      const existing = await this.prisma.permission.findUnique({
        where: { name: perm.name },
      });
      if (!existing) {
        await this.prisma.permission.create({ data: perm });
        created++;
      }
    }

    console.log(`🔐 Permissions seeded: ${created} new permissions created (${permissionsToCreate.length} total defined)`);
    return { created, total: permissionsToCreate.length };
  }
}
