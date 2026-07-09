import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimetableSlotDto {
  @ApiProperty({ description: 'Day of week 0-6' })
  @IsInt()
  dayOfWeek!: number;

  @ApiProperty({ description: 'Slot number in the day' })
  @IsInt()
  slotNumber!: number;

  @ApiPropertyOptional({ description: 'Start time, e.g. 09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time, e.g. 10:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Subject ID assigned to this slot' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Teacher ID assigned to this slot' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Room assigned for the slot' })
  @IsOptional()
  @IsString()
  room?: string;
}

export class CreateTimetableDto {
  @ApiProperty({ description: 'College ID' })
  @IsUUID()
  collegeId!: string;

  @ApiProperty({ description: 'Academic session ID' })
  @IsUUID()
  academicSessionId!: string;

  @ApiProperty({ description: 'Department ID' })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ description: 'Course ID' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ description: 'Semester ID' })
  @IsUUID()
  semesterId!: string;

  @ApiProperty({ description: 'Division ID' })
  @IsUUID()
  divisionId!: string;

  @ApiPropertyOptional({ type: [CreateTimetableSlotDto], description: 'Optional timetable slots' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableSlotDto)
  slots?: CreateTimetableSlotDto[];
}

export class UpdateTimetableDto {
  @ApiProperty({ description: 'Timetable ID' })
  @IsUUID()
  id!: string;

  @ApiPropertyOptional({ description: 'Mark timetable as active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class PublishTimetableDto {
  @ApiProperty({ description: 'Timetable ID' })
  @IsUUID()
  timetableId!: string;

  @ApiPropertyOptional({ description: 'Version number' })
  @IsOptional()
  @IsInt()
  version?: number;
}

export class SubstituteTeacherDto {
  @ApiProperty({ description: 'Original teacher ID' })
  @IsUUID()
  originalTeacherId!: string;

  @ApiProperty({ description: 'Substitute teacher ID' })
  @IsUUID()
  substituteTeacherId!: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ description: 'Date of substitution' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Reason for substitution' })
  @IsOptional()
  @IsString()
  reason?: string;
}
