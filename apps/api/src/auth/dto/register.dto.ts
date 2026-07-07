import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'student@collegea.edu' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'New User' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'STUDENT', enum: Role })
  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;

  @ApiProperty({ example: 'college-a' })
  @IsString()
  @IsNotEmpty()
  collegeId!: string;

  // Student specific fields
  @ApiProperty({ example: 'CS-2026-089', required: false })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiProperty({ example: 'ADM-902341', required: false })
  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @ApiProperty({ example: 'Male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: '2005-05-15', required: false })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({ example: '+91 9876543210', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ example: '102, Shanti Nagar, Thane', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Ramesh Rivera', required: false })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiProperty({ example: '+91 9876543211', required: false })
  @IsOptional()
  @IsString()
  parentMobile?: string;

  @ApiProperty({ example: 'div-a', required: false })
  @IsOptional()
  @IsString()
  divisionId?: string;

  // Teacher specific fields
  @ApiProperty({ example: 'dept-id', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
