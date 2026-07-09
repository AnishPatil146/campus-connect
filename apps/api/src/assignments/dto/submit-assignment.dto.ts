import { IsString, IsOptional, IsBoolean, IsInt, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GRADED = 'GRADED',
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: 'https://storage.example.com/submissions/unit2.zip' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'unit2.zip' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ example: 'Submitted my homework with source and report.' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isLate?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  attemptNumber?: number;

  @ApiPropertyOptional({ enum: SubmissionStatus, example: SubmissionStatus.SUBMITTED })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;
}
