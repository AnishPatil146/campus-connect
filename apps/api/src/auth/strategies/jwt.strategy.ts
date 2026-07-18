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
    console.time(`[JWT validate] sub:${payload.sub}`);
    const startValidate = Date.now();

    // Check if session is cached in Redis
    if (payload.sessionId) {
      const cachedSession: any = await this.redis.getSession(payload.sub, payload.sessionId);
      if (cachedSession) {
        // Tenant isolation validation
        const activeStore = collegeStorage.getStore();
        if (activeStore && activeStore.collegeId) {
          const isSuperAdmin = cachedSession.email === 'super@campusconnect.com' || cachedSession.role === 'SUPER_ADMIN';
          if (!isSuperAdmin && cachedSession.collegeId !== activeStore.collegeId) {
            throw new ForbiddenException('Access denied: Tenant mismatch');
          }
        }
        console.log(`[JWT validate] Cache HIT in ${Date.now() - startValidate}ms`);
        console.timeEnd(`[JWT validate] sub:${payload.sub}`);
        return {
          id: cachedSession.id || cachedSession.userId,
          email: cachedSession.email,
          name: cachedSession.name,
          role: cachedSession.role || null,
          permissions: cachedSession.permissions || [],
          collegeId: cachedSession.collegeId,
          sessionId: cachedSession.sessionId || null,
        };
      }
    }

    // Cache miss fallback: query database
    console.log('[JWT validate] Cache MISS, querying database...');
    const userPromise = this.prisma.user.findUnique({
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

    const sessionPromise = payload.sessionId
      ? this.prisma.refreshToken.findUnique({ where: { id: payload.sessionId } })
      : Promise.resolve(null);

    const [user, session] = await Promise.all([userPromise, sessionPromise]);

    if (payload.sessionId && (!session || session.expiresAt < new Date())) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase().replace('_', ' ')}. Access denied.`);
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted. Access denied.');
    }

    if (payload.role) {
      const userHasRole = user.userRoles.some((ur) => ur.role.name === payload.role);
      if (!userHasRole) {
        throw new UnauthorizedException('Unauthorized role for this session');
      }
    }

    const activeUserRole = user.userRoles.find((ur) => ur.role.name === payload.role);
    const permissions: string[] = activeUserRole
      ? activeUserRole.role.rolePermissions.map((rp) => rp.permission.name)
      : [];

    // Tenant isolation validation
    const activeStore = collegeStorage.getStore();
    if (activeStore && activeStore.collegeId) {
      const isSuperAdmin = user.email === 'super@campusconnect.com' || payload.role === 'SUPER_ADMIN';
      if (!isSuperAdmin && user.collegeId !== activeStore.collegeId) {
        throw new ForbiddenException('Access denied: Tenant mismatch');
      }
    }

    const validatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: payload.role || null,
      permissions,
      collegeId: user.collegeId,
      sessionId: payload.sessionId || null,
    };

    // Cache the validated user session back in Redis for subsequent requests
    if (payload.sessionId) {
      this.redis.setSession(payload.sub, payload.sessionId, {
        ...validatedUser,
        browser: 'Unknown',
        device: 'Unknown',
        ipAddress: null,
        createdAt: new Date().toISOString(),
      }).catch((err) => console.error('[JWT Strategy] Failed to cache back session:', err));
    }

    console.timeEnd(`[JWT validate] sub:${payload.sub}`);
    return validatedUser;
  }
}
