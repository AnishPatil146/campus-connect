import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'BSc Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'BSCCS-101' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  credits?: number;

  @ApiPropertyOptional({ example: 'college-a' })
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiProperty({ description: 'Parent Department ID' })
  @IsUUID()
  departmentId!: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'BSc Information Technology' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'BSCIT-101' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  credits?: number;

  @ApiPropertyOptional({ example: 'college-a' })
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional({ description: 'Parent Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
