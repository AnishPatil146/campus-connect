import { IsString, IsUUID, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeAssignmentDto {
  @ApiProperty({ example: '73d1b2e2-4a7f-4e09-8d93-79f3d4b3f611' })
  @IsUUID()
  submissionId!: string;

  @ApiProperty({ example: 88 })
  @IsInt()
  obtainedMarks!: number;

  @ApiPropertyOptional({ example: 'Well structured submission with complete answers.' })
  @IsString()
  @IsOptional()
  feedback?: string;
}
