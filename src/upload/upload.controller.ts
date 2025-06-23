import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Logger,
  Get,
  Param,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../minio/minio.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Readable } from 'stream';
import * as multer from 'multer';

// Define the Multer File interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Katta fayllar uchun custom multer config
const largeFileMulterConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
    fieldSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
});

@ApiTags('📁 Fayl yuklash')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly minioService: MinioService) {}

  @Post()
  @ApiOperation({
    summary: 'Fayl yuklash (kichik fayllar)',
    description: 'Kichik fayllarni (100MB gacha) yuklash'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Yuklanadigan fayl',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yuklanadigan fayl (maksimal 100MB)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Kichik fayl yuklash so\'rovi keldi');

    if (!file) {
      throw new BadRequestException('Fayl talab qilinadi');
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException('Bu endpoint orqali maksimal 100MB fayl yuklash mumkin. Katta fayllar uchun /upload/large-stream dan foydalaning');
    }

    try {
      const multerFile: MulterFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        destination: file.destination || '',
        filename: file.filename || '',
        path: file.path || '',
        buffer: file.buffer,
      };

      const fileUrl = await this.minioService.uploadFile(multerFile);

      return {
        success: true,
        message: 'Fayl muvaffaqiyatli yuklandi',
        data: {
          url: fileUrl,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      };
    } catch (error) {
      this.logger.error(`Fayl yuklashda xatolik: ${error.message}`, error.stack);
      throw new BadRequestException(`Fayl yuklashda xatolik: ${error.message}`);
    }
  }

  @Post('large-stream')
  @ApiOperation({
    summary: 'Katta fayl yuklash (Stream)',
    description: 'Katta fayllarni (5GB gacha) chunk\'lar orqali stream yuklash'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yuklanadigan katta fayl (maksimal 5GB)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 * 1024, // 5GB
      fieldSize: 5 * 1024 * 1024 * 1024, // 5GB
      fields: 10,
      files: 1,
    },
  }))
  async uploadLargeFileStream(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fayl topilmadi');
    }

    this.logger.log(`Katta fayl yuklash boshlandi: ${file.originalname}, hajmi: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      throw new BadRequestException('Fayl hajmi 5GB dan oshmasligi kerak');
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.originalname.split('.').pop();
    const objectName = `large-${timestamp}-${randomString}.${extension}`;

    try {
      // Katta fayllar uchun chunk stream yaratish
      const chunkSize = 64 * 1024 * 1024; // 64MB chunk size
      const stream = this.createChunkedStream(file.buffer, chunkSize);

      const url = await this.minioService.uploadLargeFileStream(
        stream,
        file.size,
        file.mimetype,
        objectName,
      );

      this.logger.log(`Katta fayl muvaffaqiyatli yuklandi: ${file.originalname}`);

      return {
        success: true,
        message: 'Katta fayl muvaffaqiyatli yuklandi',
        data: {
          url,
          filename: file.originalname,
          objectName,
          size: file.size,
          sizeFormatted: this.formatBytes(file.size),
          mimetype: file.mimetype,
          uploadMethod: 'large-stream',
          chunkSize: '64MB',
        },
      };
    } catch (error) {
      this.logger.error(`Katta fayl yuklashda xatolik: ${error.message}`, error.stack);
      throw new BadRequestException(`Katta fayl yuklashda xatolik: ${error.message}`);
    }
  }

  // True multipart upload endpoint that bypasses Multer
  @Post('large-stream-direct')
  @Public() // Make this endpoint public to avoid auth issues during large uploads
  @ApiOperation({
    summary: 'Katta fayl yuklash (To\'g\'ridan-to\'g\'ri stream)',
    description: 'Katta fayllarni (5GB gacha) to\'g\'ridan-to\'g\'ri stream orqali yuklash. Bu endpoint Multer va body-parser ni chetlab o\'tadi va faylni to\'g\'ridan-to\'g\'ri MinIO ga yuklaydi.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yuklanadigan katta fayl (maksimal 5GB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fayl muvaffaqiyatli yuklandi',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Katta fayl muvaffaqiyatli yuklandi' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string', example: 'https://cdn.example.com/files/large-file.zip' },
            objectName: { type: 'string', example: 'large-123456789-abcdef.zip' },
          }
        }
      }
    }
  })
  async uploadLargeFileStreamDirect(@Req() req, @Res() res) {
    this.logger.log('Katta fayl to\'g\'ridan-to\'g\'ri stream orqali yuklash boshlandi');

    try {
      // Extract content type from headers
      const contentType = req.headers['content-type'] || 'application/octet-stream';

      // Generate a unique object name
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);

      // Try to extract filename from content-disposition header if available
      let filename = 'unknown';
      const contentDisposition = req.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const extension = filename.split('.').pop() || 'bin';
      const objectName = `large-direct-${timestamp}-${randomString}.${extension}`;

      // Use the MinIO service to handle the multipart upload
      await this.minioService.uploadLargeFileMultipart(
        req,
        res,
        contentType,
        objectName,
      );

      // Response is handled inside the MinIO service
    } catch (error) {
      this.logger.error(`Katta fayl yuklashda xatolik: ${error.message}`, error.stack);
      res.status(400).json({
        success: false,
        message: `Katta fayl yuklashda xatolik: ${error.message}`,
      });
    }
  }

  @Post('stream')
  @ApiOperation({
    summary: 'Fayl yuklash (Stream - o\'rta hajm)',
    description: 'O\'rta hajmdagi fayllarni (500MB gacha) stream orqali yuklash'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yuklanadigan fayl (maksimal 500MB)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
  }))
  async uploadFileStream(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Fayl topilmadi yoki noto\'g\'ri format');
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new BadRequestException('Bu endpoint orqali maksimal 500MB fayl yuklash mumkin. Katta fayllar uchun /upload/large-stream dan foydalaning');
    }

    this.logger.log(`Stream yuklash: ${file.originalname}, hajmi: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    const timestamp = Date.now();
    const objectName = `stream-${timestamp}-${file.originalname}`;

    try {
      // Buffer'dan optimized stream yaratish
      const stream = this.createOptimizedStream(file.buffer);

      const url = await this.minioService.uploadFileStream(
        stream,
        file.size,
        file.mimetype,
        objectName,
      );

      this.logger.log(`Fayl stream orqali yuklandi: ${file.originalname}`);

      return {
        success: true,
        message: 'Fayl stream orqali muvaffaqiyatli yuklandi',
        data: {
          url,
          filename: file.originalname,
          objectName,
          size: file.size,
          sizeFormatted: this.formatBytes(file.size),
          mimetype: file.mimetype,
          uploadMethod: 'stream',
        },
      };
    } catch (error) {
      this.logger.error(`Stream yuklashda xatolik: ${error.message}`, error.stack);
      throw new BadRequestException(`Stream yuklashda xatolik: ${error.message}`);
    }
  }

  // Chunked stream yaratish katta fayllar uchun
  private createChunkedStream(buffer: Buffer, chunkSize: number): Readable {
    let offset = 0;
    const stream = new Readable({
      highWaterMark: chunkSize,
      read() {
        if (offset >= buffer.length) {
          this.push(null); // Stream tugadi
          return;
        }

        const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
        offset += chunk.length;
        this.push(chunk);
      }
    });

    return stream;
  }

  // Optimized stream yaratish o'rta fayllar uchun
  private createOptimizedStream(buffer: Buffer): Readable {
    const chunkSize = 16 * 1024 * 1024; // 16MB chunks
    let offset = 0;

    const stream = new Readable({
      highWaterMark: chunkSize,
      read() {
        if (offset >= buffer.length) {
          this.push(null);
          return;
        }

        const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
        offset += chunk.length;
        this.push(chunk);
      }
    });

    return stream;
  }

  // Bytes formatini chiroyli ko'rsatish
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  @Post('multiple')
  @ApiOperation({
    summary: 'Bir nechta fayl yuklash',
    description: 'Bir vaqtda bir nechta faylni yuklash (har biri 100MB gacha)'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB per file
  }))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Hech qanday fayl topilmadi');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maksimal 10 ta fayl yuklash mumkin');
    }

    this.logger.log(`${files.length} ta fayl yuklash boshlanadi`);

    const uploadPromises = files.map(async (file, index) => {
      try {
        const multerFile: MulterFile = {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          destination: file.destination || '',
          filename: file.filename || '',
          path: file.path || '',
          buffer: file.buffer,
        };

        const url = await this.minioService.uploadFile(multerFile);

        return {
          success: true,
          index,
          filename: file.originalname,
          url,
          size: file.size,
          sizeFormatted: this.formatBytes(file.size),
          mimetype: file.mimetype,
        };
      } catch (error) {
        this.logger.error(`Fayl yuklashda xatolik (${file.originalname}): ${error.message}`);
        return {
          success: false,
          index,
          filename: file.originalname,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: failed.length === 0,
      message: `${successful.length} fayl yuklandi, ${failed.length} fayl yuklashda xatolik`,
      total: files.length,
      successful: successful.length,
      failed: failed.length,
      results,
    };
  }

  @Get('url/:filename')
  @ApiOperation({
    summary: 'Fayl URL olish',
    description: 'Fayl nomi bo\'yicha presigned URL olish'
  })
  async generateFileUrl(@Param('filename') filename: string) {
    try {
      const url = await this.minioService.generatePresignedUrl(filename);
      return {
        success: true,
        url,
        expiresIn: '24 soat',
        filename,
      };
    } catch (error) {
      this.logger.error(`URL yaratishda xatolik: ${error.message}`);
      throw new BadRequestException('URL yaratishda xatolik yuz berdi');
    }
  }

  @Delete(':filename')
  @ApiOperation({
    summary: 'Faylni o\'chirish',
    description: 'MinIO dan faylni o\'chirish'
  })
  async deleteFile(@Param('filename') filename: string) {
    try {
      await this.minioService.deleteFile(filename);

      return {
        success: true,
        message: 'Fayl muvaffaqiyatli o\'chirildi',
        filename,
      };
    } catch (error) {
      this.logger.error(`Fayl o'chirishda xatolik: ${error.message}`);
      throw new BadRequestException('Fayl o\'chirishda xatolik yuz berdi');
    }
  }

  @Get('list')
  @ApiOperation({
    summary: 'Fayllar ro\'yxati',
    description: 'MinIO dagi barcha fayllar ro\'yxatini olish'
  })
  async listFiles() {
    try {
      const files = await this.minioService.listFiles();
      const filesWithSize = files.map(file => ({
        ...file,
        sizeFormatted: this.formatBytes(file.size),
      }));

      return {
        success: true,
        count: files.length,
        files: filesWithSize,
      };
    } catch (error) {
      this.logger.error(`Fayllar ro'yxatini olishda xatolik: ${error.message}`);
      throw new BadRequestException('Fayllar ro\'yxatini olishda xatolik');
    }
  }
}
