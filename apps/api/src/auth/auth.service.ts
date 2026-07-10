import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { SelectRoleDto } from './dto/select-role.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-for-campus-connect';
  private readonly lockAttemptsLimit = 3;
  private readonly lockDurationMinutes = 15;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private redis: RedisService,
  ) {}

  // Password Validation helper matching example password requirements
  private validatePasswordStrength(password: string): boolean {
    if (password.length < 8) return false;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }

  // Parse User Agent to determine Browser and OS/Device
  private parseUserAgent(userAgent: string) {
    let browser = 'Unknown Browser';
    let device = 'Unknown Device';

    if (!userAgent) return { browser, device };

    const ua = userAgent.toLowerCase();
    
    // Browser detection
    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge') || ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

    // Device/OS detection
    if (ua.includes('windows')) device = 'Windows PC';
    else if (ua.includes('macintosh') || ua.includes('mac os')) device = 'Mac';
    else if (ua.includes('android')) device = 'Android Device';
    else if (ua.includes('iphone') || ua.includes('ipad')) device = 'iOS Device';
    else if (ua.includes('linux')) device = 'Linux PC';

    return { browser, device };
  }

  // Generate OTP helper (6-digit random code)
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Login Method
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;
    const { browser, device } = this.parseUserAgent(userAgent || '');

    // 1. Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      // Return a general unauthorized error to avoid user enumeration
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        errorCode: 'AUTH_001',
      });
    }

    // 2. Check if account is locked
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const waitTime = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      throw new UnauthorizedException({
        message: `Account is temporarily locked. Try again in ${waitTime} minutes.`,
        errorCode: 'AUTH_002',
      });
    }

    // 3. Check user account status
    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedException({
        message: 'Email not verified. Please verify your email.',
        errorCode: 'AUTH_004',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: `Your account is ${user.status.toLowerCase().replace('_', ' ')}. Please contact your administrator.`,
        errorCode: 'AUTH_003',
      });
    }

    // 4. Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const attempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (attempts >= this.lockAttemptsLimit) {
        lockedUntil = new Date(now.getTime() + this.lockDurationMinutes * 60000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      // Write failed attempt to login history
      await this.prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          device,
          browser,
          status: 'FAILED',
        },
      });

      // Write audit log
      await this.audit.log(
        user.id,
        user.name,
        'UNKNOWN',
        'Failed Login Attempt',
        `Failed login for email ${email}. Total attempts: ${attempts}.`,
      );

      if (lockedUntil) {
        throw new UnauthorizedException({
          message: `Account locked due to too many failed attempts. Try again in ${this.lockDurationMinutes} minutes.`,
          errorCode: 'AUTH_002',
        });
      }

      throw new UnauthorizedException({
        message: 'Invalid credentials',
        errorCode: 'AUTH_001',
      });
    }

    // Reset login failures on successful password verification
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const userRolesList = user.userRoles.map((ur) => ur.role.name);

    if (userRolesList.length === 0) {
      throw new UnauthorizedException('No roles assigned to this user. Access denied.');
    }

    // 5. Check if user needs workspace selection (multiple roles)
    if (userRolesList.length > 1) {
      // Generate temporary selection token valid for 5 mins
      const tempToken = jwt.sign(
        { sub: user.id, email: user.email, isTemp: true },
        this.jwtSecret,
        { expiresIn: '5m' },
      );

      return {
        needsWorkspaceSelection: true,
        tempToken,
        roles: userRolesList,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
        },
      };
    }

    // 6. Single role flow -> Complete login immediately
    const roleName = userRolesList[0];
    const sessionTokens = await this.createSession(user.id, roleName, ipAddress, userAgent);

    const studentProfile = roleName === Role.STUDENT
      ? await this.prisma.student.findUnique({ where: { userId: user.id } })
      : null;
    const teacherProfile = roleName === Role.TEACHER
      ? await this.prisma.teacher.findUnique({ where: { userId: user.id } })
      : null;

    return {
      needsWorkspaceSelection: false,
      accessToken: sessionTokens.accessToken,
      refreshToken: sessionTokens.refreshToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
        collegeId: user.collegeId,
        studentProfile,
        teacherProfile,
      },
    };
  }

  // Complete Login for Workspace selection
  async selectRole(selectRoleDto: SelectRoleDto, ipAddress?: string, userAgent?: string) {
    const { tempToken, role } = selectRoleDto;

    // 1. Verify temporary token
    let payload: any;
    try {
      payload = jwt.verify(tempToken, this.jwtSecret);
    } catch (err) {
      throw new BadRequestException('Invalid or expired workspace selection token');
    }

    if (!payload.isTemp) {
      throw new BadRequestException('Invalid workspace selection token type');
    }

    const userId = payload.sub;

    // 2. Load user and check active status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or suspended.');
    }

    // 3. Verify user actually has the requested role
    const hasRole = user.userRoles.some((ur) => ur.role.name === role);
    if (!hasRole) {
      throw new BadRequestException(`Requested role ${role} is not assigned to this user`);
    }

    // 4. Create session and generate final tokens
    const sessionTokens = await this.createSession(user.id, role, ipAddress, userAgent);

    const studentProfile = role === Role.STUDENT
      ? await this.prisma.student.findUnique({ where: { userId: user.id } })
      : null;
    const teacherProfile = role === Role.TEACHER
      ? await this.prisma.teacher.findUnique({ where: { userId: user.id } })
      : null;

    return {
      accessToken: sessionTokens.accessToken,
      refreshToken: sessionTokens.refreshToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
        collegeId: user.collegeId,
        studentProfile,
        teacherProfile,
      },
    };
  }

  // Create session Helper
  private async createSession(userId: string, role: string, ipAddress?: string, userAgent?: string) {
    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (teacher && teacher.status === 'RETIRED') {
        throw new UnauthorizedException('Teacher is retired. Login is blocked.');
      }
    }

    const { browser, device } = this.parseUserAgent(userAgent || '');

    // Set expiry
    // Access token: 30 minutes. Refresh token: 7 days
    const accessTokenExpiry = '30m';
    const refreshTokenExpiry = '7d';

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);

    // Create session record in DB
    const session = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: '', // Set placeholder, we'll store hash of the signed token
        expiresAt: sessionExpiresAt,
        device,
        browser,
        ipAddress,
      },
    });

    // Create active Session record
    await this.prisma.session.create({
      data: {
        userId,
        sessionToken: session.id,
        browser: browser || 'Unknown',
        os: device || 'Unknown',
        ipAddress: ipAddress || 'Unknown',
        expiresAt: sessionExpiresAt,
        isActive: true,
      },
    });

    // Update last login on user
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });

    // Sign Refresh Token
    const refreshTokenPayload = {
      sub: userId,
      sessionId: session.id,
      role,
    };
    const refreshToken = jwt.sign(refreshTokenPayload, this.jwtSecret, { expiresIn: refreshTokenExpiry });

    // Hash refresh token for secure DB storage
    const tokenHash = bcrypt.hashSync(refreshToken, 10);
    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { tokenHash },
    });

    // Sign Access Token (including role and sessionId)
    const accessTokenPayload = {
      sub: userId,
      email: (await this.prisma.user.findUnique({ where: { id: userId } }))?.email,
      role,
      sessionId: session.id,
    };
    const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, { expiresIn: accessTokenExpiry });

    // Record login history
    await this.prisma.loginHistory.create({
      data: {
        userId,
        ipAddress,
        device,
        browser,
        status: 'SUCCESS',
      },
    });

    // Audit Log
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.audit.log(
      userId,
      user?.name || 'Unknown',
      role,
      'Logged In',
      `Session created. Browser: ${browser}, Device: ${device}.`,
    );

    // Cache session payload in Redis for fast lookups
    await this.redis.setSession(userId, session.id, {
      userId,
      sessionId: session.id,
      role,
      browser,
      device,
      ipAddress: ipAddress || null,
      createdAt: new Date().toISOString(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // Refresh Token Rotation
  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

    // 1. Verify Refresh Token
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, this.jwtSecret);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, sessionId, role } = payload;

    // 2. Lookup session in DB
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.refreshToken.delete({ where: { id: sessionId } });
        await this.prisma.session.deleteMany({ where: { sessionToken: sessionId } });
      }
      throw new UnauthorizedException('Session expired or revoked');
    }

    // Verify token hash matches
    const isHashValid = bcrypt.compareSync(refreshToken, session.tokenHash);
    if (!isHashValid) {
      // Security Alert: Potential token theft. Revoke all sessions of the user.
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      await this.prisma.session.deleteMany({ where: { userId } });
      throw new UnauthorizedException('Security breach detected. Revoking all sessions.');
    }

    // 3. Verify user status
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is suspended or inactive.');
    }

    // 4. Generate new tokens (Rotate Refresh Token)
    // Delete old session
    await this.prisma.refreshToken.delete({ where: { id: sessionId } });
    await this.prisma.session.deleteMany({ where: { sessionToken: sessionId } });

    // Create new session
    const newSessionTokens = await this.createSession(userId, role, session.ipAddress || undefined, session.browser ? `Mozilla/5.0 (${session.device}) ${session.browser}` : undefined);

    return newSessionTokens;
  }

  // Logout Specific Session
  async logout(sessionId: string, userId: string, userName: string, role: string) {
    const sessionExists = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (sessionExists) {
      await this.prisma.refreshToken.delete({
        where: { id: sessionId },
      });
      await this.prisma.session.deleteMany({
        where: { sessionToken: sessionId },
      });
    }

    // Record audit log
    await this.audit.log(
      userId,
      userName,
      role,
      'Logged Out',
      `Session revoked. Session ID: ${sessionId}`,
    );

    // Remove session from Redis cache
    await this.redis.deleteSession(userId, sessionId);

    return true;
  }

  // Logout All Sessions for a user
  async logoutAll(userId: string, userName: string, role: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Record audit log
    await this.audit.log(
      userId,
      userName,
      role,
      'Logged Out All Devices',
      `All active refresh tokens cleared.`,
    );

    // Clear all cached sessions from Redis for this user
    // Note: Since we can't wildcard-delete by pattern in cache-manager, we
    // rely on TTL expiry for remaining Redis session keys after DB is cleared.
    // Individual sessions are removed on next access attempt via validateSession.

    return true;
  }

  // Forgot Password: Request OTP
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return a success message to prevent account enumeration
      return {
        message: 'If the email matches an active account, an OTP has been sent.',
      };
    }

    // Generate 6 digit OTP and expiration (10 minutes)
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        otp,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Send email (Mocked in logs/console for local development)
    console.log(`
=====================================================
📧 EMAIL NOTIFICATION: PASSWORD RESET OTP
To: ${user.email}
Subject: Reset Your Campus Connect Password
Content:
Welcome to Campus Connect,
Your password reset OTP is: **${otp}**
This code will expire in 10 minutes.
=====================================================
    `);

    // Audit Log
    await this.audit.log(
      user.id,
      user.name,
      'UNKNOWN',
      'Password Reset OTP Requested',
      `OTP sent to ${user.email}. Expires in 10 minutes.`,
    );

    return {
      message: 'If the email matches an active account, an OTP has been sent.',
    };
  }

  // Verify OTP
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('No password recovery request exists for this account');
    }

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, otp, purpose: 'PASSWORD_RESET', used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Generate short-lived JWT token valid for 15 minutes to authorize the actual reset
    const tempResetToken = jwt.sign(
      { sub: user.id, email: user.email, isReset: true },
      this.jwtSecret,
      { expiresIn: '15m' },
    );

    return {
      message: 'OTP verified successfully',
      tempResetToken,
    };
  }

  // Reset Password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, tempResetToken, newPassword } = resetPasswordDto;

    // Verify temp reset token
    let payload: any;
    try {
      payload = jwt.verify(tempResetToken, this.jwtSecret);
    } catch (err) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (!payload.isReset || payload.email !== email.toLowerCase()) {
      throw new BadRequestException('Invalid reset token parameters');
    }

    // Validate password strength
    if (!this.validatePasswordStrength(newPassword)) {
      throw new BadRequestException('Password does not meet safety standards (min 8 characters, must include uppercase, lowercase, number, and special character)');
    }

    const userId = payload.sub;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash and update password
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Mock Email: Password Changed
    console.log(`
=====================================================
📧 EMAIL NOTIFICATION: PASSWORD CHANGED
To: ${user.email}
Subject: Campus Connect Password Changed
Content:
Hello ${user.name},
Your Campus Connect account password was reset successfully.
If you did not make this change, please contact system support immediately.
=====================================================
    `);

    // Audit Log
    await this.audit.log(
      userId,
      user.name,
      'UNKNOWN',
      'Password Reset Completed',
      'User password reset successfully using recovery OTP.',
    );

    return {
      message: 'Password reset successfully',
    };
  }

  // Change Password
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation password do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Verify new password strength
    if (!this.validatePasswordStrength(newPassword)) {
      throw new BadRequestException('New password does not meet safety standards (min 8 characters, must include uppercase, lowercase, number, and special character)');
    }

    // Hash and save new password
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    // Mock Email: Password Changed
    console.log(`
=====================================================
📧 EMAIL NOTIFICATION: PASSWORD CHANGED
To: ${user.email}
Subject: Campus Connect Password Changed
Content:
Hello ${user.name},
Your password has been changed successfully.
If you did not make this change, please contact support immediately.
=====================================================
    `);

    // Audit Log
    await this.audit.log(
      userId,
      user.name,
      'UNKNOWN',
      'Password Changed',
      'User changed their password from settings.',
    );

    return {
      message: 'Password changed successfully',
    };
  }

  // Fetch active sessions
  async getActiveSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { loginAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.sessionToken,
      device: s.os || 'Unknown Device',
      browser: s.browser || 'Unknown Browser',
      ipAddress: s.ipAddress || 'Unknown IP',
      loginTime: s.loginAt,
      isCurrent: s.sessionToken === currentSessionId,
    }));
  }

  // Revoke active session by id
  async revokeSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findFirst({
      where: { sessionToken: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or unauthorized');
    }

    await this.prisma.refreshToken.deleteMany({
      where: { id: sessionId, userId },
    });
    await this.prisma.session.deleteMany({
      where: { sessionToken: sessionId, userId },
    });

    return {
      message: 'Session revoked successfully',
    };
  }

  // Self-registration for students and teachers
  async register(dto: RegisterDto) {
    const emailLower = dto.email.toLowerCase().trim();
    
    // Check if email already registered
    const existing = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      throw new BadRequestException(`Email "${dto.email}" is already registered`);
    }

    const passwordHash = bcrypt.hashSync(dto.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      // Concatenate full name for User record
      const fullLastName = dto.lastName || dto.surname || '';
      const fullName = dto.firstName ? `${dto.firstName} ${fullLastName}`.trim() : dto.name;

      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          name: fullName,
          status: 'ACTIVE',
          collegeId: dto.collegeId,
          userRoles: {
            create: {
              role: {
                connect: { name: dto.role },
              },
            },
          },
        },
      });

      let resolvedDeptId = 'N/A';

      // 2. Create profile based on role
      if (dto.role === Role.STUDENT) {
        // Resolve dynamic division ID safely
        let targetDivisionId = dto.divisionId;
        if (!targetDivisionId || targetDivisionId === 'div-a' || targetDivisionId === 'div-b') {
          const divName = dto.classroom || 'Division A';
          const semName = dto.semester || 'Semester 1';

          // Try to find matching division in college
          const matchingDiv = await tx.division.findFirst({
            where: {
              name: { contains: divName, mode: 'insensitive' },
              semester: {
                name: { contains: semName, mode: 'insensitive' },
                academicSession: {
                  course: {
                    department: {
                      collegeId: dto.collegeId,
                    },
                  },
                },
              },
            },
          });

          if (matchingDiv) {
            targetDivisionId = matchingDiv.id;
          } else {
            // Fallback: Find first division belonging to this college
            const firstDiv = await tx.division.findFirst({
              where: {
                semester: {
                  academicSession: {
                    course: {
                      department: {
                        collegeId: dto.collegeId,
                      },
                    },
                  },
                },
              },
            });
            if (firstDiv) {
              targetDivisionId = firstDiv.id;
            } else {
              throw new BadRequestException('No class/division found for the selected college');
            }
          }
        }

        const division = await tx.division.findUnique({
          where: { id: targetDivisionId },
          include: {
            semester: {
              include: {
                academicSession: {
                  include: {
                    course: {
                      include: {
                        department: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!division) {
          throw new BadRequestException('Target division not found');
        }

        const collegeId = division.semester.academicSession.course.department.collegeId;
        const departmentId = division.semester.academicSession.course.departmentId;
        const courseId = division.semester.academicSession.courseId;
        const semesterId = division.semesterId;
        const academicSessionId = division.semester.academicSessionId;

        await tx.student.create({
          data: {
            userId: user.id,
            collegeId,
            departmentId,
            courseId,
            semesterId,
            divisionId: targetDivisionId,
            academicSessionId,
            rollNumber: dto.rollNumber || `ROLL-${Date.now()}`,
            admissionNo: dto.admissionNumber || `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            admissionDate: new Date(),
            currentYear: 1,
            status: 'ACTIVE',
            profile: {
              create: {
                firstName: dto.firstName || dto.name,
                middleName: null,
                lastName: dto.lastName || dto.surname || 'Profile',
                gender: dto.gender || 'MALE',
                dob: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
                phone: dto.mobile || null,
                email: user.email,
              },
            },
            guardians: {
              create: {
                fatherName: dto.fatherName || null,
                motherName: dto.motherName || null,
                guardianName: dto.parentName || null,
                phone: dto.parentMobile || null,
              },
            },
            addresses: {
              create: {
                addressLine: dto.address || 'N/A',
                city: 'Thane',
                state: 'Maharashtra',
                country: 'India',
                postalCode: '400601',
                addressType: 'CURRENT',
              },
            },
          },
        });
      } else if (dto.role === Role.TEACHER) {
        // Resolve dynamic department ID safely
        let targetDeptId = dto.departmentId;
        if (targetDeptId && targetDeptId !== 'dept-id') {
          const deptByName = await tx.department.findFirst({
            where: {
              collegeId: dto.collegeId,
              name: { contains: targetDeptId, mode: 'insensitive' },
            },
          });
          if (deptByName) {
            targetDeptId = deptByName.id;
          }
        }
        if (!targetDeptId || targetDeptId === 'dept-id') {
          const firstDept = await tx.department.findFirst({
            where: { collegeId: dto.collegeId },
          });
          if (firstDept) {
            targetDeptId = firstDept.id;
          }
        }

        resolvedDeptId = targetDeptId || 'N/A';

        const year = new Date().getFullYear();
        const count = await tx.teacher.count();
        const countStr = String(count + 1).padStart(4, '0');
        const employeeId = `TCH-${year}-${countStr}`;

        await tx.teacher.create({
          data: {
            userId: user.id,
            employeeId,
            collegeId: dto.collegeId,
            departmentId: resolvedDeptId,
            designation: 'Lecturer',
            joiningDate: new Date(),
            employmentType: 'FULL_TIME',
            status: 'ACTIVE',
            profile: {
              create: {
                firstName: dto.firstName || dto.name,
                lastName: dto.lastName || dto.surname || 'Profile',
                gender: dto.gender || 'MALE',
                dob: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
                email: user.email,
                phone: dto.mobile || null,
              },
            },
            departments: resolvedDeptId !== 'N/A' ? {
              create: {
                departmentId: resolvedDeptId,
                primaryDepartment: true,
              },
            } : undefined,
            qualifications: dto.degree ? {
              create: {
                degree: dto.degree,
                university: 'Mumbai University',
                passingYear: new Date().getFullYear() - 5,
                percentage: 75.0,
              },
            } : undefined,
          },
        });
      }

      // Notify the Admin (console representation of notification service dispatch)
      console.log(`
================================================================================
🔔 ADMIN NOTIFICATION: NEW PROFILE CREATED
To: System Administrators
Subject: Account Registration Alert - New ${dto.role} Created
Content:
A new campus member profile has been registered in the database:
- Role: ${dto.role}
- Full Name: ${fullName}
- Email/Gmail: ${user.email}
- College ID: ${dto.collegeId}
- Created At: ${new Date().toLocaleString()}
${dto.role === Role.STUDENT ? `
Student-specific Details:
- Classroom: ${dto.classroom || 'Default Division'}
- Roll Number: ${dto.rollNumber || 'N/A'}
- Semester: ${dto.semester || 'Semester 1'}
- Subjects/Degree: ${dto.courseType === 'DEGREE' ? dto.degree : (dto.subjects?.join(', ') || 'None')}
` : `
Teacher-specific Details:
- Degree/Qualification: ${dto.degree || 'N/A'}
- Department ID/Name: ${resolvedDeptId}
`}
Action Required: Please review credentials or allocate schedules accordingly.
================================================================================
      `);

      // Send profile confirmation email to the student/teacher gmail (console representation)
      console.log(`
================================================================================
📧 EMAIL NOTIFICATION: PROFILE REGISTRATION CONFIRMATION
To: ${user.email}
Subject: Welcome to Campus Connect - Profile Registered!
Content:
Dear ${fullName},

Your Campus Connect profile has been successfully created.
- Account Role: ${dto.role}
- Registered Email: ${user.email}
- Account Status: ACTIVE (Ready to log in)

You can now use these credentials to log in to the Campus Connect platform.

If you did not register this account, please contact the IT Helpdesk immediately.

Best regards,
The Campus Connect Team
================================================================================
      `);

      await this.audit.log(
        user.id,
        user.name,
        dto.role,
        'User Registered',
        `User ${user.email} self-registered as a ${dto.role.toLowerCase()}. Name: ${fullName}, Admin notified.`,
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: dto.role,
      };
    });
  }
}
