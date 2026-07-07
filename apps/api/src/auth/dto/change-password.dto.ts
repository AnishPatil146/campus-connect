import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'newPassword123!' })
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;

  @ApiProperty({ example: 'newPassword123!' })
  @IsNotEmpty()
  confirmPassword!: string;
}
