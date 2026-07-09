import { IsString, IsEmail, IsNotEmpty, IsOptional, IsUUID, IsArray, MinLength, IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectAssignmentDto {
  @ApiProperty({ example: 'subject-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({ example: 'division-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  divisionId!: string;

  @ApiProperty({ example: 'academic-session-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  academicSessionId!: string;
}

export class CreateTeacherDto {
  @ApiProperty({ example: 'teacher@college.edu' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: 'SecurePassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'Dr. Sarah Jenkins' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'college-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  collegeId!: string;

  @ApiProperty({ example: 'department-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;

  @ApiPropertyOptional({ example: 'Professor' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: '2026-07-08' })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiProperty({ example: 'FULL_TIME' })
  @IsString()
  @IsNotEmpty()
  employmentType!: string; // FULL_TIME, PART_TIME, VISITING, GUEST

  // Profile Details
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Middle' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Jenkins' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'Female' })
  @IsString()
  @IsNotEmpty()
  gender!: string;

  @ApiProperty({ example: '1985-04-12' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @ApiPropertyOptional({ example: '+91 9876543213' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'https://photo-url' })
  @IsOptional()
  @IsString()
  photo?: string;

  // Qualification Details (Optional for creation seed/form)
  @ApiPropertyOptional({ example: 'PhD' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ example: 'Stanford University' })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({ example: 2012 })
  @IsOptional()
  @IsNumber()
  passingYear?: number;

  @ApiPropertyOptional({ example: 92.5 })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  // Address Details
  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '94105' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'CURRENT' })
  @IsOptional()
  @IsString()
  addressType?: string;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: 'Sarah' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Jenkins' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Professor & HOD' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: '+91 9876543215' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'FULL_TIME' })
  @IsOptional()
  @IsString()
  employmentType?: string;
}

export class AssignSubjectsDto {
  @ApiProperty({ type: [SubjectAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectAssignmentDto)
  assignments!: SubjectAssignmentDto[];
}
