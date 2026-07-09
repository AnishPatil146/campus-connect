import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Data Structures & Algorithms' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'CS-201' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Link to Course ID' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ description: 'Link to Department ID' })
  @IsUUID()
  departmentId!: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  creditHours?: number;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Data Structures' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'CS-201-A' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  creditHours?: number;
}
