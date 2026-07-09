import { IsString, IsOptional, IsDateString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AnnouncementTargetDto {
  @ApiProperty({ example: 'DEPARTMENT' })
  @IsString()
  targetType!: string;

  @ApiPropertyOptional({ example: 'dept-uuid-here' })
  @IsString()
  @IsOptional()
  targetId?: string;
}

export class AnnouncementAttachmentDto {
  @ApiProperty({ example: 'https://storage.example.com/files/schedule.pdf' })
  @IsString()
  fileUrl!: string;

  @ApiProperty({ example: 'schedule.pdf' })
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  fileType!: string;

  @ApiPropertyOptional({ example: 102400 })
  @IsOptional()
  fileSize?: number;
}

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Mid-Semester Exam Schedule Released' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'The mid-semester examination schedule for all departments has been published.' })
  @IsString()
  content!: string;

  @ApiProperty({ example: 'Exam', enum: ['Notice', 'Result', 'Holiday', 'Warning', 'Exam', 'General'] })
  @IsString()
  @IsIn(['Notice', 'Result', 'Holiday', 'Warning', 'Exam', 'General'])
  category!: string;

  @ApiPropertyOptional({ example: 'Entire College' })
  @IsString()
  @IsOptional()
  target?: string;

  @ApiPropertyOptional({ example: 'PUBLISHED', enum: ['PUBLISHED', 'SCHEDULED', 'DRAFT'] })
  @IsString()
  @IsOptional()
  @IsIn(['PUBLISHED', 'SCHEDULED', 'DRAFT'])
  status?: string;

  @ApiPropertyOptional({ example: 'NORMAL', enum: ['HIGH', 'NORMAL', 'LOW'] })
  @IsString()
  @IsOptional()
  @IsIn(['HIGH', 'NORMAL', 'LOW'])
  priority?: string;

  @ApiPropertyOptional({ example: '2026-07-10T10:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ type: [AnnouncementTargetDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementTargetDto)
  targets?: AnnouncementTargetDto[];

  @ApiPropertyOptional({ type: [AnnouncementAttachmentDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAttachmentDto)
  attachments?: AnnouncementAttachmentDto[];
}
