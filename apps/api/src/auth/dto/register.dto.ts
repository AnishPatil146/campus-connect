import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MinLength, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'student@collegea.edu' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'New User', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'STUDENT', enum: Role, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: 'college-a' })
  @IsString()
  @IsNotEmpty()
  collegeId!: string;

  // Added Name and Surname fields
  @ApiProperty({ example: 'Rahul', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Patil', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'Patil', required: false })
  @IsOptional()
  @IsString()
  surname?: string;

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

  @ApiProperty({ example: 'Sunita Rivera', required: false })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiProperty({ example: 'Ramesh Rivera', required: false })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiProperty({ example: '+91 9876543211', required: false })
  @IsOptional()
  @IsString()
  parentMobile?: string;

  @ApiProperty({ example: 'div-a', required: false })
  @IsOptional()
  @IsString()
  divisionId?: string;

  // Course, degree, subjects, semester, classroom
  @ApiProperty({ example: 'DEGREE', required: false })
  @IsOptional()
  @IsString()
  courseType?: string;

  @ApiProperty({ example: 'Science', required: false })
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiProperty({ example: ['Physics', 'Chemistry'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiProperty({ example: 'BSc IT', required: false })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiProperty({ example: 'Semester 1', required: false })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiProperty({ example: 'Division A', required: false })
  @IsOptional()
  @IsString()
  classroom?: string;

  // Teacher specific fields
  @ApiProperty({ example: 'dept-id', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
