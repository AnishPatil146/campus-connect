import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { collegeStorage } from '../../common/college-storage';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('FATAL CONFIG ERROR: JWT_SECRET environment variable is required!');
        }
        return secret;
      })(),
    });
  }

  async validate(payload: any) {
    // 0. Validate active session (cached in Redis or stored in DB)
    if (payload.sessionId) {
      const cachedSession = await this.redis.getSession(payload.sub, payload.sessionId);
      if (!cachedSession) {
        // Fallback to DB check
        const session = await this.prisma.refreshToken.findUnique({
          where: { id: payload.sessionId },
        });
        if (!session || session.expiresAt < new Date()) {
          throw new UnauthorizedException('Session expired or revoked');
        }
        // Cache it back for next requests
        await this.redis.setSession(payload.sub, payload.sessionId, {
          userId: payload.sub,
          sessionId: payload.sessionId,
          role: payload.role,
          collegeId: payload.collegeId,
          createdAt: new Date().toISOString(),
        });
      }
    }
    // 1. Fetch user and their roles with permissions from RolePermission table
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
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
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // 2. Check account status — only ACTIVE users can make API requests
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase().replace('_', ' ')}. Access denied.`);
    }

    // 3. Check soft delete
    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted. Access denied.');
    }

    // 4. If the payload contains a role, verify user actually has it
    if (payload.role) {
      const userHasRole = user.userRoles.some((ur) => ur.role.name === payload.role);
      if (!userHasRole) {
        throw new UnauthorizedException('Unauthorized role for this session');
      }
    }

    // 5. Retrieve permissions for the active role from RolePermission → Permission
    const activeUserRole = user.userRoles.find((ur) => ur.role.name === payload.role);
    let permissions: string[] = [];

    if (activeUserRole) {
      permissions = activeUserRole.role.rolePermissions.map(
        (rp) => rp.permission.name,
      );
    }

    // Tenant isolation validation
    const activeStore = collegeStorage.getStore();
    if (activeStore && activeStore.collegeId) {
      const isSuperAdmin = user.email === 'super@campusconnect.com' || payload.role === 'SUPER_ADMIN';
      if (!isSuperAdmin && user.collegeId !== activeStore.collegeId) {
        throw new ForbiddenException('Access denied: Tenant mismatch');
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: payload.role || null,
      permissions,
      collegeId: user.collegeId,
      sessionId: payload.sessionId || null,
    };
  }
}
