import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class GoogleLoginDto {
  @ApiProperty({ example: 'mock-google-token-student@collegea.edu' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'college-a' })
  @IsString()
  @IsNotEmpty()
  collegeId!: string;

  @ApiProperty({ example: 'STUDENT', enum: Role })
  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;
}
