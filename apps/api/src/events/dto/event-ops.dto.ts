import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterEventDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsUUID()
  studentId!: string;
}

export class SubmitAttendanceDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: 'PRESENT' })
  @IsString()
  status!: string; // PRESENT | ABSENT
}

export class SubmitResultDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: 'WINNER' })
  @IsString()
  position!: string; // WINNER | RUNNER_UP | THIRD | PARTICIPATION

  @ApiPropertyOptional({ example: 95.5 })
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({ example: 'Exceptional performance.' })
  @IsString()
  @IsOptional()
  judgeRemarks?: string;
}

export class CreateCertificateDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: 'WINNER' })
  @IsString()
  certificateType!: string;

  @ApiProperty({ example: 'https://storage.example.com/certificates/c1.pdf' })
  @IsString()
  certificateUrl!: string;
}

export class CreateFeedbackDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Great event! Learned a lot.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
