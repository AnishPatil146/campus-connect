import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.cc_access_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('FATAL CONFIG ERROR: JWT_SECRET environment variable is required!');
        }
        return secret;
      })(),
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    // Validate session via DB
    if (payload.sessionId) {
      const session = await this.prisma.refreshToken.findUnique({
        where: { id: payload.sessionId },
      });
      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired or revoked');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User no longer exists');
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase().replace('_', ' ')}. Access denied.`);
    }
    if (user.deletedAt) throw new UnauthorizedException('Account has been deleted. Access denied.');

    if (payload.role) {
      const hasRole = user.userRoles.some((ur) => ur.role.name === payload.role);
      if (!hasRole) throw new UnauthorizedException('Unauthorized role for this session');
    }

    const activeUserRole = user.userRoles.find((ur) => ur.role.name === payload.role);
    const permissions: string[] = activeUserRole
      ? activeUserRole.role.rolePermissions.map((rp) => rp.permission.name)
      : [];

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
