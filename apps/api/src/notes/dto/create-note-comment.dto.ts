import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteCommentDto {
  @ApiProperty({ example: 'This note is very helpful, thank you!' })
  @IsString()
  comment!: string;

  @ApiPropertyOptional({ example: 'd7d6a1b9-9bbc-4f65-8fb5-3a88d8ae4482' })
  @IsUUID()
  @IsOptional()
  replyToId?: string;
}
