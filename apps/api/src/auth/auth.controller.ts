import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login using email and password' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    
    // Log successful login activity
    await this.auditService.log(
      result.user.id,
      result.user.name,
      result.user.role,
      'Logged In',
      `User signed in using email: ${result.user.email}`,
    );

    return {
      message: 'Login successful',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout currently logged in user' })
  async logout(@Req() req: any) {
    const user = req.user;
    
    // Log logout activity
    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Logged Out',
      `User logged out: ${user.email}`,
    );

    return {
      message: 'Logout successful',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve currently logged in user profile' })
  async getMe(@Req() req: any) {
    return {
      message: 'User profile retrieved successfully',
      data: req.user,
    };
  }
}
