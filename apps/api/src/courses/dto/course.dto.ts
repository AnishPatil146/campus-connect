import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'BSc Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

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

  @ApiPropertyOptional({ description: 'Parent Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
