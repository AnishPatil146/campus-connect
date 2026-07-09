import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], description: 'Array of permission IDs to assign' })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}

export class AssignRoleToUserDto {
  @ApiProperty({ description: 'User ID to assign the role to' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: ['ADMIN', 'TEACHER', 'STUDENT'], description: 'Role to assign' })
  @IsString()
  role!: string;
}
