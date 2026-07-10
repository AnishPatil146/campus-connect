import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import * as https from 'https';
import { Readable } from 'stream';

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  storagePath: string;
  publicId?: string;
  fileSize: number;
  checksum: string;
  mimeType: string;
  uploadedBy: string;
  module: string;
  createdAt: string;
}

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly registryPath = path.join(this.uploadDir, 'file-registry.json');

  constructor(private audit: AuditService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.registryPath)) {
      fs.writeFileSync(this.registryPath, JSON.stringify([]));
    }

    if (process.env.CLOUDINARY_URL) {
      cloudinary.config();
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
      });
    }
  }

  private async uploadToCloudinary(fileBuffer: Buffer, folder: string, publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  private readRegistry(): FileMetadata[] {
    try {
      const data = fs.readFileSync(this.registryPath, 'utf8');
      return JSON.parse(data || '[]');
    } catch {
      return [];
    }
  }

  private writeRegistry(data: FileMetadata[]) {
    fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2));
  }

  async uploadFile(
    file: Express.Multer.File,
    module: string,
    userId: string,
    userName: string,
    role: string,
  ) {
    // 1. Validate size limits (Section 14.4)
    this.validateSizeLimit(file.size, module);

    // 2. Validate file types (Section 14.3)
    this.validateFileType(file.originalname);

    // 3. Generate UUID filename (Section 14.7)
    const fileId = this.generateUuid();
    const ext = path.extname(file.originalname);
    const uniqueName = `${fileId}${ext}`;

    let storagePath = uniqueName;
    let publicId = '';

    try {
      const uploadResult = await this.uploadToCloudinary(file.buffer, `campus_connect/${module.toLowerCase()}`, fileId);
      storagePath = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } catch (err: any) {
      console.warn('Cloudinary upload failed, falling back to local storage:', err.message || err);
      const localPath = path.join(this.uploadDir, uniqueName);
      fs.writeFileSync(localPath, file.buffer);
    }

    // 5. Generate checksum (Mock checksum generation)
    const checksum = 'mock-checksum-' + fileId;

    // 6. Save metadata
    const metadata: FileMetadata = {
      id: fileId,
      name: uniqueName,
      originalName: file.originalname,
      storagePath,
      publicId: publicId || undefined,
      fileSize: file.size,
      checksum,
      mimeType: file.mimetype,
      uploadedBy: userId,
      module: module.toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    const registry = this.readRegistry();
    registry.push(metadata);
    this.writeRegistry(registry);

    // 7. Audit log (Section 14.13)
    await this.audit.log(
      userId,
      userName,
      role,
      'UPLOAD_FILE',
      `Uploaded file ${file.originalname} for module ${module}`,
      'files',
      'File',
      fileId,
    );

    return metadata;
  }

  async getFileMetadata(id: string) {
    const registry = this.readRegistry();
    const file = registry.find((f) => f.id === id);
    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }
    return file;
  }

  async getFileStream(id: string, userId: string, userName: string, role: string) {
    const file = await this.getFileMetadata(id);

    await this.audit.log(
      userId,
      userName,
      role,
      'DOWNLOAD_FILE',
      `Downloaded file ${file.originalName}`,
      'files',
      'File',
      id,
    );

    if (file.storagePath.startsWith('http')) {
      const stream = await new Promise<Readable>((resolve, reject) => {
        https.get(file.storagePath, (res) => {
          resolve(res);
        }).on('error', (e) => {
          reject(new BadRequestException(`Failed to stream file from cloud storage: ${e.message}`));
        });
      });

      return {
        stream,
        originalName: file.originalName,
        mimeType: file.mimeType,
      };
    }

    const filePath = path.join(this.uploadDir, file.storagePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Physical file not found on disk');
    }

    return {
      stream: fs.createReadStream(filePath),
      originalName: file.originalName,
      mimeType: file.mimeType,
    };
  }

  async deleteFile(id: string, userId: string, userName: string, role: string) {
    const file = await this.getFileMetadata(id);

    if (file.publicId) {
      try {
        await cloudinary.uploader.destroy(file.publicId);
      } catch (err: any) {
        console.warn(`Failed to destroy Cloudinary asset for ${file.originalName}:`, err.message || err);
      }
    } else {
      const filePath = path.join(this.uploadDir, file.storagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    let registry = this.readRegistry();
    registry = registry.filter((f) => f.id !== id);
    this.writeRegistry(registry);

    await this.audit.log(
      userId,
      userName,
      role,
      'DELETE_FILE',
      `Deleted file ${file.originalName}`,
      'files',
      'File',
      id,
    );

    return { id, deleted: true };
  }

  async renameFile(id: string, newName: string, userId: string, userName: string, role: string) {
    const registry = this.readRegistry();
    const index = registry.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    const file = registry[index];
    const ext = path.extname(file.originalName);
    const updatedOriginalName = newName.endsWith(ext) ? newName : `${newName}${ext}`;

    registry[index] = {
      ...file,
      originalName: updatedOriginalName,
    };
    this.writeRegistry(registry);

    await this.audit.log(
      userId,
      userName,
      role,
      'RENAME_FILE',
      `Renamed file from ${file.originalName} to ${updatedOriginalName}`,
      'files',
      'File',
      id,
    );

    return registry[index];
  }

  async getFilesByModule(moduleName: string) {
    const registry = this.readRegistry();
    return registry.filter((f) => f.module === moduleName.toLowerCase());
  }

  private validateSizeLimit(size: number, module: string) {
    const MB = 1024 * 1024;
    let limit = 100 * MB; // default limit 100MB

    const mod = module.toLowerCase();
    if (mod === 'profiles' || mod === 'profile') {
      limit = 10 * MB;
    } else if (mod === 'reports') {
      limit = 50 * MB;
    } else if (mod === 'documents') {
      limit = 100 * MB;
    } else if (mod === 'assignments') {
      limit = 250 * MB;
    } else if (mod === 'videos') {
      limit = 500 * MB;
    }

    if (size > limit) {
      throw new BadRequestException(`File size exceeds limit for module "${module}". Limit is ${limit / MB} MB.`);
    }
  }

  private validateFileType(filename: string) {
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const blockedTypes = ['exe', 'bat', 'dll', 'js', 'apk'];
    if (blockedTypes.includes(ext)) {
      throw new BadRequestException(`File type ".${ext}" is blocked for security reasons.`);
    }
  }

  private generateUuid(): string {
    return 'f_' + Math.random().toString(36).substring(2, 10);
  }
}
