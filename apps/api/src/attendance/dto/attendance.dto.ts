import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceSessionRecordDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Optional remarks for the record' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateAttendanceSessionDto {
  @ApiProperty({ description: 'College ID' })
  @IsUUID()
  collegeId!: string;

  @ApiProperty({ description: 'Academic session ID' })
  @IsUUID()
  academicSessionId!: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ description: 'Teacher ID' })
  @IsUUID()
  teacherId!: string;

  @ApiProperty({ description: 'Semester ID' })
  @IsUUID()
  semesterId!: string;

  @ApiProperty({ description: 'Division ID' })
  @IsUUID()
  divisionId!: string;

  @ApiPropertyOptional({ description: 'Classroom ID' })
  @IsOptional()
  @IsUUID()
  classroomId?: string;

  @ApiProperty({ description: 'Lecture number for this session', example: 1 })
  @IsInt()
  lectureNumber!: number;

  @ApiProperty({ description: 'Attendance date (YYYY-MM-DD)' })
  @IsDateString()
  attendanceDate!: string;

  @ApiPropertyOptional({ description: 'Session start time, e.g. 09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Session end time, e.g. 10:00' })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'Attendance session ID' })
  @IsUUID()
  attendanceSessionId!: string;

  @ApiProperty({ type: [AttendanceSessionRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceSessionRecordDto)
  records!: AttendanceSessionRecordDto[];
}

export class UpdateAttendanceDto {
  @ApiProperty({ description: 'Attendance record ID' })
  @IsUUID()
  recordId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Optional remark update' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AttendanceRequestDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ description: 'Type of leave' })
  @IsString()
  leaveType!: string;

  @ApiPropertyOptional({ description: 'Reason for leave' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Start date of leave', example: '2026-07-01' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ description: 'End date of leave', example: '2026-07-03' })
  @IsDateString()
  toDate!: string;
}

export class AttendanceCorrectionDto {
  @ApiProperty({ description: 'Attendance record ID' })
  @IsUUID()
  attendanceRecordId!: string;

  @ApiProperty({ description: 'Reason for correction' })
  @IsString()
  reason!: string;
}

export class AttendanceReportQueryDto {
  @ApiPropertyOptional({ description: 'Optional student ID to filter by' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Optional division ID to filter by' })
  @IsOptional()
  @IsUUID()
  divisionId?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
