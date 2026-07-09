import { IsString, IsOptional, IsUUID, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Unit 2 Homework' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Complete questions 1 through 10 from the textbook.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'c3f9d9bb-4a2f-4c6b-a5a4-b3c5d3b9c2f7' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ example: 'de0c201b-3d7c-4ca4-aba4-9f9d187a2f5d' })
  @IsUUID()
  semesterId!: string;

  @ApiProperty({ example: '9a4a5d0b-8b3d-4cf2-a8d1-7b9c799d17a4' })
  @IsUUID()
  divisionId!: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @IsOptional()
  totalMarks?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsInt()
  @IsOptional()
  passingMarks?: number;

  @ApiProperty({ example: '2026-08-01T23:59:59.000Z' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowLateSubmission?: boolean;

  @ApiPropertyOptional({ example: 'DRAFT' })
  @IsString()
  @IsOptional()
  status?: string;
}
