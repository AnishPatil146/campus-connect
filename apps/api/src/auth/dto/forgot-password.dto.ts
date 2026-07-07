import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'student@college.edu' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
