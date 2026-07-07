import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-jwt-key-for-campus-connect',
    });
  }

  async validate(payload: any) {
    // 1. Fetch user and their roles
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // 2. Check account status (Active, Inactive, Suspended, Pending Verification)
    // Only Active users can perform API requests.
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase().replace('_', ' ')}. Access denied.`);
    }

    // 3. If the payload contains a role, verify that the user actually possesses it
    if (payload.role) {
      const userHasRole = user.userRoles.some((ur) => ur.role.name === payload.role);
      if (!userHasRole) {
        throw new UnauthorizedException('Unauthorized role for this session');
      }
    }

    // 4. Retrieve permissions for this active role (if applicable)
    const activeUserRole = user.userRoles.find((ur) => ur.role.name === payload.role);
    const permissions = activeUserRole ? activeUserRole.role.permissions : [];

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
