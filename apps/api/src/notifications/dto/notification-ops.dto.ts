import { IsString, IsOptional, IsBoolean, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferenceDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowPush?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  allowSMS?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowInApp?: boolean;
}

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Urgent: Campus Closed Tomorrow' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Due to severe weather conditions, the campus will remain closed tomorrow.' })
  @IsString()
  body!: string;

  @ApiProperty({ example: 'ALL_STUDENTS', enum: ['ALL_STUDENTS', 'DEPARTMENT', 'SEMESTER', 'DIVISION', 'TEACHERS'] })
  @IsString()
  @IsIn(['ALL_STUDENTS', 'DEPARTMENT', 'SEMESTER', 'DIVISION', 'TEACHERS'])
  targetType!: string;

  @ApiPropertyOptional({ example: 'dept-uuid-here' })
  @IsString()
  @IsOptional()
  targetId?: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({ example: 'New Assignment Posted' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'You have a new assignment in Mathematics.' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ example: 'IN_APP', enum: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: '/dashboard/assignments' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ example: '{}' })
  @IsString()
  @IsOptional()
  metadata?: string;
}
