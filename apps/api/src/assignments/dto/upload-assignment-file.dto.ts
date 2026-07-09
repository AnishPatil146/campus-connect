import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadAssignmentFileDto {
  @ApiProperty({ example: 'https://storage.example.com/assignments/unit2.zip' })
  @IsString()
  storageUrl!: string;

  @ApiProperty({ example: 'application/zip' })
  @IsString()
  fileType!: string;

  @ApiPropertyOptional({ example: 'unit2.zip' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ example: 2483248 })
  @IsInt()
  @IsOptional()
  size?: number;
}
