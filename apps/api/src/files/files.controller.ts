import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('Files')
@Controller('api/v1/files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        module: { type: 'string', example: 'notes' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('module') module: string,
    @Req() req: any,
  ) {
    const data = await this.filesService.uploadFile(
      file,
      module || 'documents',
      req.user.id,
      req.user.name,
      req.user.role,
    );
    return {
      success: true,
      message: 'File uploaded successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  async getMetadata(@Param('id') id: string) {
    const data = await this.filesService.getFileMetadata(id);
    return {
      success: true,
      message: 'File metadata retrieved successfully',
      data,
    };
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Download a file by ID' })
  async download(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const file = await this.filesService.getFileStream(id, req.user.id, req.user.name, req.user.role);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    file.stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const data = await this.filesService.deleteFile(id, req.user.id, req.user.name, req.user.role);
    return {
      success: true,
      message: 'File deleted successfully',
      data,
    };
  }

  @Patch('rename')
  @ApiOperation({ summary: 'Rename a file' })
  async rename(
    @Body('id') id: string,
    @Body('newName') newName: string,
    @Req() req: any,
  ) {
    const data = await this.filesService.renameFile(id, newName, req.user.id, req.user.name, req.user.role);
    return {
      success: true,
      message: 'File renamed successfully',
      data,
    };
  }

  @Get('module/:module')
  @ApiOperation({ summary: 'Get files by module category' })
  async getByModule(@Param('module') module: string) {
    const data = await this.filesService.getFilesByModule(module);
    return {
      success: true,
      message: `Files for module "${module}" retrieved successfully`,
      data,
    };
  }
}
