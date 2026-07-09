import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicSessionDto {
  @ApiProperty({ example: '2026-27' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Link to Course ID' })
  @IsUUID()
  courseId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateAcademicSessionDto {
  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateSemesterDto {
  @ApiProperty({ example: 'Semester 1' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  number!: number;
}

export class CreateDivisionDto {
  @ApiProperty({ example: 'Division A' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
