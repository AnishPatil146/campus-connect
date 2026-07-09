import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Get all roles with their permissions.
   */
  async findAll() {
    const roles = await this.prisma.roleModel.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      usersCount: r._count.userRoles,
      permissions: r.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      createdAt: r.createdAt,
    }));
  }

  /**
   * Get a single role by ID with permissions.
   */
  async findOne(id: string) {
    const role = await this.prisma.roleModel.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      usersCount: role._count.userRoles,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
    };
  }

  /**
   * Get a role by its enum name.
   */
  async findByName(name: Role) {
    const role = await this.prisma.roleModel.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${name} not found`);
    }

    return role;
  }

  /**
   * Update role description.
   */
  async update(id: string, data: { description?: string }, userId: string, userName: string, userRole: string) {
    const role = await this.prisma.roleModel.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    const updated = await this.prisma.roleModel.update({
      where: { id },
      data: { description: data.description },
    });

    await this.audit.log(userId, userName, userRole, 'Updated Role', `Updated role ${role.name}. Description: ${data.description}`, 'roles', 'RoleModel', id);

    return updated;
  }

  /**
   * Assign permissions to a role.
   */
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    userId: string,
    userName: string,
    userRole: string,
  ) {
    const role = await this.prisma.roleModel.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Remove existing and add new (replace strategy)
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({
          data: { roleId, permissionId },
        }),
      ),
    ]);

    await this.audit.log(
      userId,
      userName,
      userRole,
      'Assigned Permissions',
      `Assigned ${permissionIds.length} permissions to role ${role.name}`,
      'roles',
      'RoleModel',
      roleId,
    );

    return this.findOne(roleId);
  }

  /**
   * Add a single permission to a role.
   */
  async addPermission(roleId: string, permissionId: string, userId: string, userName: string, userRole: string) {
    const role = await this.prisma.roleModel.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role with ID ${roleId} not found`);

    const permission = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) throw new NotFoundException(`Permission with ID ${permissionId} not found`);

    // Check if already assigned
    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (existing) {
      throw new BadRequestException(`Permission ${permission.name} is already assigned to role ${role.name}`);
    }

    await this.prisma.rolePermission.create({ data: { roleId, permissionId } });

    await this.audit.log(userId, userName, userRole, 'Added Permission', `Added permission ${permission.name} to role ${role.name}`, 'roles', 'RoleModel', roleId);

    return this.findOne(roleId);
  }

  /**
   * Remove a single permission from a role.
   */
  async removePermission(roleId: string, permissionId: string, userId: string, userName: string, userRole: string) {
    const role = await this.prisma.roleModel.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role with ID ${roleId} not found`);

    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });

    await this.audit.log(userId, userName, userRole, 'Removed Permission', `Removed permission from role ${role.name}`, 'roles', 'RoleModel', roleId);

    return this.findOne(roleId);
  }

  /**
   * Get the full permission matrix (roles vs permissions grid).
   */
  async getPermissionMatrix() {
    const roles = await this.prisma.roleModel.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const allPermissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Build matrix: for each permission, show which roles have it
    const matrix = allPermissions.map((perm) => ({
      permission: {
        id: perm.id,
        name: perm.name,
        module: perm.module,
        action: perm.action,
      },
      roles: roles.reduce((acc, role) => {
        acc[role.name] = role.rolePermissions.some((rp) => rp.permissionId === perm.id);
        return acc;
      }, {} as Record<string, boolean>),
    }));

    return {
      roles: roles.map((r) => ({ id: r.id, name: r.name })),
      permissions: matrix,
    };
  }

  /**
   * Assign a role to a user.
   */
  async assignRoleToUser(userId: string, roleName: Role, adminId: string, adminName: string, adminRole: string) {
    const role = await this.prisma.roleModel.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    // Check if already assigned
    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (existing) {
      throw new BadRequestException(`User already has role ${roleName}`);
    }

    await this.prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    await this.audit.log(adminId, adminName, adminRole, 'Assigned Role', `Assigned role ${roleName} to user ${user.email}`, 'roles', 'User', userId);

    return { message: `Role ${roleName} assigned to user ${user.email}` };
  }

  /**
   * Remove a role from a user.
   */
  async removeRoleFromUser(userId: string, roleName: Role, adminId: string, adminName: string, adminRole: string) {
    const role = await this.prisma.roleModel.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });

    await this.audit.log(adminId, adminName, adminRole, 'Removed Role', `Removed role ${roleName} from user ${user.email}`, 'roles', 'User', userId);

    return { message: `Role ${roleName} removed from user ${user.email}` };
  }
}
