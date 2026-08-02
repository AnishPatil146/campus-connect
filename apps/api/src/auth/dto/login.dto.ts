import { IsNotEmpty, MinLength, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'user@college.edu or PRN12345' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'ADMIN', required: false, enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'college-a', required: false })
  @IsOptional()
  @IsString()
  collegeId?: string;
}
