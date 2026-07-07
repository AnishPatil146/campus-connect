import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'student@college.edu' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'The temporary reset token received after verifying OTP' })
  @IsNotEmpty()
  @IsString()
  tempResetToken!: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword!: string;
}
