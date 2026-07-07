import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectRoleDto {
  @ApiProperty({ description: 'Temporary token issued after initial authentication' })
  @IsNotEmpty()
  @IsString()
  tempToken!: string;

  @ApiProperty({ description: 'The role/workspace to select', example: 'TEACHER' })
  @IsNotEmpty()
  @IsString()
  role!: string;
}
