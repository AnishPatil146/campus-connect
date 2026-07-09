import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEducationGroupDto {
  @ApiProperty({ example: 'Patil Education Trust' })
  @IsString()
  name!: string;
}

export class UpdateEducationGroupDto {
  @ApiPropertyOptional({ example: 'Patil Education Trust (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;
}
