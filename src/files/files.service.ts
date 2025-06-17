import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { FileCategory } from '@prisma/client';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

// Định nghĩa kiểu cho file upload
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// Định nghĩa interface cho metadata file
interface FileMetadata {
  id: string;
  uploaderId: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  bucket: string;
  createdAt: Date;
  updatedAt: Date;
  path?: string;
  category?: FileCategory;
}

export interface ServiceImageUploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  category: string;
  thumbnailUrl?: string;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:1338';

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  // Upload file with user context
  async upload(file: UploadedFile, uploaderId: string) {
    // Kiểm tra buffer có tồn tại không
    if (!file.buffer) {
      throw new Error('File buffer is required');
    }

    // Process file (resize if image, etc.)
    let buffer = file.buffer;
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      buffer = await this.resizeImage(buffer, file.mimetype);
    }

    // Generate a unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const now = new Date();

    // Upload to storage provider
    const url = await this.uploadToCloudinary(buffer, filename);

    // Create metadata object
    const meta: FileMetadata = {
      id: uuidv4(),
      filename,
      size: file.size,
      mimeType: file.mimetype,
      url,
      uploaderId,
      bucket: 'cloudinary',
      createdAt: now,
      updatedAt: now,
    };
    await this.saveMetadata(meta);
    return meta;
  }

  // Method for uploading audio files without creating a File record
  async uploadAudio(file: UploadedFile) {
    // Kiểm tra buffer có tồn tại không
    if (!file.buffer) {
      throw new Error('File buffer is required');
    }

    const fileName = `audio-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const url = await this.uploadToCloudinary(file.buffer, fileName);
    return {
      url,
      bucket: 'cloudinary',
    };
  }

  async saveMetadata(meta: FileMetadata) {
    // Lưu metadata vào DB (Prisma), chỉ dùng các trường tương thích với schema
    return this.prisma.file.create({
      data: {
        id: meta.id,
        fileName: meta.filename,
        // Store original name in metadata if needed
        metadata: { originalName: meta.filename },
        // Use sizeBytes instead of size if that's what the schema has
        sizeBytes: meta.size,
        mimeType: meta.mimeType,
        objectKey: meta.path || '', // Use objectKey instead of path if that's what the schema has
        bucket: 'cloudinary', // Add required bucket property
        url: meta.url || '', // Add required url property
        category: meta.category || FileCategory.IMAGE, // Use IMAGE as default instead of OTHER
        uploaderId: meta.uploaderId, // Use uploaderId field instead of uploadedBy
      },
    });
  }

  async resizeImage(buffer: Buffer, mimeType: string) {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return await sharp(buffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .toBuffer();
    }
    return buffer;
  }

  async uploadToCloudinary(buffer: Buffer, filename: string) {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { public_id: filename, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(new Error(error.message));
          resolve(result?.secure_url || '');
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadServiceImage(
    file: Express.Multer.File,
    serviceId: string,
    category: 'main' | 'gallery' | 'detail' | 'thumbnail' = 'main',
    userId: string,
  ): Promise<ServiceImageUploadResult> {
    try {
      this.validateImageFile(file);

      if (!file.buffer) {
        throw new BadRequestException('File buffer is missing');
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const serviceDir = path.join(this.uploadPath, 'services', serviceId);
      await this.ensureDirectoryExists(serviceDir);

      const filePath = path.join(serviceDir, filename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Generate thumbnail for main images
      let thumbnailUrl: string | undefined;
      if (category === 'main' || category === 'gallery') {
        thumbnailUrl = await this.generateThumbnail(
          filePath,
          serviceDir,
          filename,
        );
      }

      // Save to database
      const fileRecord = await this.prisma.file.create({
        data: {
          id: crypto.randomUUID(),
          fileName: filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          objectKey: `services/${serviceId}/${filename}`,
          url: `${this.baseUrl}/uploads/services/${serviceId}/${filename}`,
          bucket: 'local',
          uploaderId: userId,
          category: this.mapCategoryToEnum(category),
          metadata: {
            serviceId,
            category,
            uploadedBy: userId,
            originalPath: filePath,
            dimensions: await this.getImageDimensions(filePath),
            ...(thumbnailUrl && { thumbnailUrl }),
          },
        },
      });

      // Update service with new image URL if main image
      if (category === 'main') {
        await this.updateServiceMainImage(serviceId, fileRecord.url);
      }

      this.logger.log(
        `Service image uploaded successfully: ${filename} for service ${serviceId}`,
      );

      return {
        id: fileRecord.id,
        url: fileRecord.url,
        filename: fileRecord.fileName,
        size: fileRecord.sizeBytes,
        mimeType: fileRecord.mimeType,
        category,
        thumbnailUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to upload service image:`, error);
      throw error;
    }
  }

  async uploadMultipleServiceImages(
    files: Express.Multer.File[],
    serviceId: string,
    category: 'gallery' | 'detail' = 'gallery',
    userId: string,
  ): Promise<ServiceImageUploadResult[]> {
    const results: ServiceImageUploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadServiceImage(
          file,
          serviceId,
          category,
          userId,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to upload file ${file.originalname}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  async getServiceImages(
    serviceId: string,
    category?: 'main' | 'gallery' | 'detail' | 'thumbnail',
  ): Promise<ServiceImageUploadResult[]> {
    const where: any = {
      metadata: {
        path: ['serviceId'],
        equals: serviceId,
      },
    };

    if (category) {
      where.metadata = {
        ...where.metadata,
        path: ['category'],
        equals: category,
      };
    }

    const files = await this.prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file) => ({
      id: file.id,
      url: file.url,
      filename: file.fileName,
      size: file.sizeBytes,
      mimeType: file.mimeType,
      category: (file.metadata as any)?.category || 'main',
      thumbnailUrl: (file.metadata as any)?.thumbnailUrl,
    }));
  }

  async deleteServiceImage(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.prisma.file.findUnique({ where: { id: fileId } });

      if (!file) {
        throw new BadRequestException('File not found');
      }

      // Delete physical file
      try {
        const filePath = (file.metadata as any)?.originalPath || file.objectKey;
        await fs.unlink(filePath);

        // Delete thumbnail if exists
        const metadata = file.metadata as any;
        if (metadata?.thumbnailUrl) {
          const thumbnailPath = this.urlToPath(metadata.thumbnailUrl);
          await fs.unlink(thumbnailPath).catch(() => {}); // Ignore thumbnail deletion errors
        }
      } catch (error) {
        this.logger.warn(
          `Failed to delete physical file: ${(file.metadata as any)?.originalPath}`,
          error,
        );
      }

      // Delete from database
      await this.prisma.file.delete({ where: { id: fileId } });

      this.logger.log(
        `Service image deleted: ${file.fileName} by user ${userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to delete service image:`, error);
      throw error;
    }
  }

  async optimizeServiceImages(serviceId: string): Promise<{
    optimized: number;
    totalSize: number;
    savedSpace: number;
  }> {
    // This would implement image optimization
    // For now, return mock data
    return {
      optimized: 0,
      totalSize: 0,
      savedSpace: 0,
    };
  }

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and AVIF are allowed.',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB.',
      );
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async generateThumbnail(
    originalPath: string,
    outputDir: string,
    originalFilename: string,
  ): Promise<string> {
    try {
      const thumbnailFilename = `thumb-${originalFilename}`;
      const thumbnailPath = path.join(outputDir, thumbnailFilename);

      // Copy original as thumbnail (in real implementation, resize it)
      await fs.copyFile(originalPath, thumbnailPath);

      return thumbnailPath.replace(this.uploadPath, `${this.baseUrl}/uploads`);
    } catch (error) {
      this.logger.error('Failed to generate thumbnail:', error);
      return '';
    }
  }

  private async getImageDimensions(
    filePath: string,
  ): Promise<{ width: number; height: number }> {
    // In a real implementation, you would use Sharp or similar library
    return { width: 800, height: 600 };
  }

  private mapCategoryToEnum(category: string): FileCategory {
    const categoryMap: Record<string, FileCategory> = {
      main: FileCategory.IMAGE,
      gallery: FileCategory.IMAGE,
      detail: FileCategory.IMAGE,
      thumbnail: FileCategory.IMAGE,
    };
    return categoryMap[category] || FileCategory.IMAGE;
  }

  private async updateServiceMainImage(
    serviceId: string,
    imageUrl: string,
  ): Promise<void> {
    try {
      await this.prisma.service.update({
        where: { id: serviceId },
        data: {
          metadata: {
            imageUrl: imageUrl,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update service main image: ${serviceId}`,
        error,
      );
    }
  }

  private urlToPath(url: string): string {
    return url.replace(`${this.baseUrl}/uploads`, this.uploadPath);
  }
}
