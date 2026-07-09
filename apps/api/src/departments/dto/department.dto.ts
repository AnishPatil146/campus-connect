import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'College ID (defaults to user college context)' })
  @IsOptional()
  @IsUUID()
  collegeId?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Information Technology' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
