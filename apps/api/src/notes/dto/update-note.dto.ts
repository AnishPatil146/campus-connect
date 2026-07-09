import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NoteVisibility, NoteStatus } from './create-note.dto';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'DBMS Unit 2 Lecture Notes - Updated' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated lecture notes for Unit 2.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/notes/dbms-unit2-v2.pdf' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'dbms-unit2-v2.pdf' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ example: 1248242 })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ example: 'c3f9d9bb-4a2f-4c6b-a5a4-b3c5d3b9c2f7' })
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'de0c201b-3d7c-4ca4-aba4-9f9d187a2f5d' })
  @IsUUID()
  @IsOptional()
  semesterId?: string;

  @ApiPropertyOptional({ example: '9a4a5d0b-8b3d-4cf2-a8d1-7b9c799d17a4' })
  @IsUUID()
  @IsOptional()
  divisionId?: string;

  @ApiPropertyOptional({ example: 'b4c9b8fa-7d4d-4a4f-bd1d-23b9f5e8e4a5' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: NoteVisibility })
  @IsEnum(NoteVisibility)
  @IsOptional()
  visibility?: NoteVisibility;

  @ApiPropertyOptional({ enum: NoteStatus })
  @IsEnum(NoteStatus)
  @IsOptional()
  status?: NoteStatus;

  @ApiPropertyOptional({ example: '2026-07-10T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  publishDate?: string;

  @ApiPropertyOptional({ example: '2027-01-15T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'Fixed typo in the syllabus section.' })
  @IsString()
  @IsOptional()
  changeLog?: string;
}
