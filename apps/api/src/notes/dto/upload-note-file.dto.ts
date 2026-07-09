import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadNoteFileDto {
    @ApiProperty({ example: 'dbms-unit2.pdf' })
    @IsString()
    fileName!: string;

    @ApiProperty({ example: 1248242 })
    @IsNumber()
    fileSize!: number;

    @ApiProperty({ example: 'application/pdf' })
    @IsString()
    mimeType!: string;

    @ApiProperty({ example: 'https://storage.example.com/notes/dbms-unit2.pdf' })
    @IsString()
    storageUrl!: string;

    @ApiProperty({ example: 'abc123checksum' })
    @IsString()
    checksum!: string;
}
