import { Controller, Post, Get, Delete, Body, Req, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectRoleDto } from './dto/select-role.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check API health' })
  health() {
    return { status: 'OK' };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new student or teacher account' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const recaptchaToken = req.headers['x-recaptcha-token'] as string;
    await this.authService.verifyRecaptcha(recaptchaToken);
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'Account registered successfully',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login using email and password' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = (req.headers['cf-connecting-ip'] as string) || 
                      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.ip || 
                      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const recaptchaToken = req.headers['x-recaptcha-token'] as string;
    const collegeIdHeader = req.headers['x-college-id'] as string;

    await this.authService.verifyRecaptcha(recaptchaToken);
    const result = await this.authService.login(loginDto, ipAddress, userAgent, collegeIdHeader);

    return {
      message: result.needsWorkspaceSelection
        ? 'Multiple roles detected, please select a workspace'
        : 'Login successful',
      data: result,
    };
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login or register using Google Sign-In token' })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto, @Req() req: Request) {
    const ipAddress = (req.headers['cf-connecting-ip'] as string) || 
                      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.ip || 
                      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const recaptchaToken = req.headers['x-recaptcha-token'] as string;

    await this.authService.verifyRecaptcha(recaptchaToken);
    const result = await this.authService.googleLogin(googleLoginDto, ipAddress, userAgent);

    return {
      message: 'Google login successful',
      data: result,
    };
  }

  @Post('select-role')
  @ApiOperation({ summary: 'Select active role/workspace for multi-role user' })
  async selectRole(@Body() selectRoleDto: SelectRoleDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.selectRole(selectRoleDto, ipAddress, userAgent);

    return {
      message: 'Workspace selected successfully',
      data: result,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT access token using refresh token' })
  async refresh(@Body() refreshDto: RefreshDto) {
    const result = await this.authService.refresh(refreshDto);
    return {
      message: 'Tokens refreshed successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout currently active session' })
  async logout(@Req() req: any) {
    const { id, name, role, sessionId } = req.user;
    if (sessionId) {
      await this.authService.logout(sessionId, id, name, role || 'UNKNOWN');
    }
    return {
      message: 'Logout successful',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@Req() req: any) {
    const { id, name, role } = req.user;
    await this.authService.logoutAll(id, name, role || 'UNKNOWN');
    return {
      message: 'Successfully logged out from all devices',
      data: null,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP via email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: result.message,
      data: null,
    };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify password recovery OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    return {
      message: result.message,
      data: {
        tempResetToken: result.tempResetToken,
      },
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using temp recovery token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return {
      message: result.message,
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password after logging in' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
    const result = await this.authService.changePassword(req.user.id, changePasswordDto);
    return {
      message: result.message,
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve currently logged in user profile' })
  async getMe(@Req() req: any) {
    const result = await this.authService.getMe(req.user.id, req.user.role);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions for the user' })
  async getSessions(@Req() req: any) {
    const sessions = await this.authService.getActiveSessions(req.user.id, req.user.sessionId);
    return {
      message: 'Active sessions retrieved successfully',
      data: sessions,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an active session by session ID' })
  async revokeSession(@Param('id') sessionId: string, @Req() req: any) {
    const result = await this.authService.revokeSession(sessionId, req.user.id);
    return {
      message: result.message,
      data: null,
    };
  }
}

