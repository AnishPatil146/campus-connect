import { IsString, IsOptional, IsDateString, IsInt, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Connect Hackathon 2026' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'A 24-hour coding challenge.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Main Seminar Hall' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiProperty({ example: '2026-07-15T09:00:00.000Z' })
  @IsDateString()
  startDatetime!: string;

  @ApiPropertyOptional({ example: '2026-07-16T17:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endDatetime?: string;

  @ApiPropertyOptional({ example: '2026-07-10T09:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  registrationStart?: string;

  @ApiPropertyOptional({ example: '2026-07-14T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  registrationEnd?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsInt()
  @IsOptional()
  maximumParticipants?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  registrationRequired?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  approvalRequired?: boolean;

  @ApiPropertyOptional({ enum: EventStatus, example: EventStatus.DRAFT })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional({ example: 'category-uuid-here' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
