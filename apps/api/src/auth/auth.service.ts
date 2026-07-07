import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if account is locked
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const waitTime = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      throw new UnauthorizedException(`Account is temporarily locked. Try again in ${waitTime} minutes.`);
    }

    // 3. Check user account status
    // Only ACTIVE accounts can log in
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Your account is ${user.status.toLowerCase().replace('_', ' ')}. Please contact your administrator.`);
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
        throw new UnauthorizedException(`Account locked due to too many failed attempts. Try again in ${this.lockDurationMinutes} minutes.`);
      }

      throw new UnauthorizedException('Invalid credentials');
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
      },
    };
  }

  // Create session Helper
  private async createSession(userId: string, role: string, ipAddress?: string, userAgent?: string) {
    const { browser, device } = this.parseUserAgent(userAgent || '');

    // Set expiry
    // Access token: 30 minutes. Refresh token: 7 days (or 30 days if remember me is handled, we support 7 days by default, or configurable).
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
      }
      throw new UnauthorizedException('Session expired or revoked');
    }

    // Verify token hash matches
    const isHashValid = bcrypt.compareSync(refreshToken, session.tokenHash);
    if (!isHashValid) {
      // Security Alert: Potential token theft. Revoke all sessions of the user.
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
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
    }

    // Record audit log
    await this.audit.log(
      userId,
      userName,
      role,
      'Logged Out',
      `Session revoked. Session ID: ${sessionId}`,
    );

    return true;
  }

  // Logout All Sessions for a user
  async logoutAll(userId: string, userName: string, role: string) {
    await this.prisma.refreshToken.deleteMany({
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
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

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('No password recovery request exists for this account');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.otpCode !== otp) {
      throw new BadRequestException('Invalid OTP code');
    }

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
        otpCode: null,
        otpExpiresAt: null,
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
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      device: s.device || 'Unknown Device',
      browser: s.browser || 'Unknown Browser',
      ipAddress: s.ipAddress || 'Unknown IP',
      loginTime: s.createdAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  // Revoke active session by id
  async revokeSession(sessionId: string, userId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or unauthorized');
    }

    await this.prisma.refreshToken.delete({
      where: { id: sessionId },
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
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          name: dto.name,
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

      // 2. Create profile based on role
      if (dto.role === Role.STUDENT) {
        // Resolve dynamic division ID safely
        let targetDivisionId = dto.divisionId;
        if (!targetDivisionId || targetDivisionId === 'div-a' || targetDivisionId === 'div-b') {
          // Find first division belonging to this college
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

        await tx.student.create({
          data: {
            userId: user.id,
            divisionId: targetDivisionId,
            rollNumber: dto.rollNumber || null,
            admissionNumber: dto.admissionNumber || null,
            gender: dto.gender || null,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            mobile: dto.mobile || null,
            address: dto.address || null,
            parentName: dto.parentName || null,
            parentMobile: dto.parentMobile || null,
            isActive: true,
          },
        });
      } else if (dto.role === Role.TEACHER) {
        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
          },
        });

        // Resolve dynamic department ID safely
        let targetDeptId = dto.departmentId;
        if (!targetDeptId || targetDeptId === 'dept-id') {
          const firstDept = await tx.department.findFirst({
            where: { collegeId: dto.collegeId },
          });
          if (firstDept) {
            targetDeptId = firstDept.id;
          }
        }

        if (targetDeptId) {
          await tx.teacher.update({
            where: { id: teacher.id },
            data: {
              departments: {
                connect: { id: targetDeptId },
              },
            },
          });
        }
      }

      await this.audit.log(
        user.id,
        user.name,
        dto.role,
        'User Registered',
        `User ${user.email} self-registered as a ${dto.role.toLowerCase()}`,
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
