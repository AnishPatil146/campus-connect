import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        college: true,
      },
    });

    if (!user || !bcrypt.compareSync(loginDto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
    };

    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-for-campus-connect';
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        collegeId: user.collegeId,
        collegeName: user.college?.name || null,
      },
    };
  }
}
