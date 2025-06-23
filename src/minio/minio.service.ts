import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinioClient from 'minio';
import { Readable, PassThrough } from 'stream';

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

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: MinioClient.Client;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const minioConfig = this.configService.get('minio');

    if (!minioConfig) {
      throw new Error('MinIO konfiguratsiyasi topilmadi');
    }

    this.minioClient = new MinioClient.Client({
      endPoint: minioConfig.endPoint,
      useSSL: minioConfig.useSSL || false,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
      region: minioConfig.region || 'us-east-1',
      partSize: 64 * 1024 * 1024, // 64MB part size for multipart uploads
    });

    this.logger.log('MinIO client yaratildi');

    try {
      await this.testConnection();
      await this.checkAndCreateBucket(minioConfig.bucket);
    } catch (error) {
      this.logger.error('MinIO ulanishida xatolik:', error.message);
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      await this.minioClient.listBuckets();
      this.logger.log('MinIO ga ulanish muvaffaqiyatli');
    } catch (error) {
      this.logger.error('MinIO ga ulanishda xatolik:', error.message);
      throw new Error('MinIO serveriga ulanib bo\'lmadi');
    }
  }

  private async checkAndCreateBucket(bucket: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        await this.minioClient.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Bucket '${bucket}' yaratildi`);
      } else {
        this.logger.log(`Bucket '${bucket}' mavjud`);
      }
    } catch (error) {
      this.logger.error(`Bucket tekshirish/yaratishda xatolik: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(
    file: MulterFile,
    objectName?: string,
    folder?: string,
  ): Promise<string> {
    const bucket = this.configService.get('minio.bucket');

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.originalname.split('.').pop();
    const fileName = objectName || `${timestamp}-${randomString}.${extension}`;

    const fullObjectName = folder ? `${folder}/${fileName}` : fileName;

    try {
      const metaData = {
        'Content-Type': file.mimetype,
        'Content-Length': file.size.toString(),
        'X-Original-Name': encodeURIComponent(file.originalname),
        'X-Upload-Date': new Date().toISOString(),
      };

      await this.minioClient.putObject(
        bucket,
        fullObjectName,
        file.buffer,
        file.size,
        metaData,
      );

      this.logger.log(`Fayl yuklandi: ${fullObjectName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      const fileUrl = await this.generatePresignedUrl(fullObjectName);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Fayl yuklashda xatolik: ${error.message}`, error.stack);
      throw new Error(`Fayl yuklashda xatolik: ${error.message}`);
    }
  }

  async uploadFileStream(
    stream: Readable,
    size: number,
    mimetype: string,
    objectName: string,
    folder?: string,
  ): Promise<string> {
    const bucket = this.configService.get('minio.bucket');
    const fullObjectName = folder ? `${folder}/${objectName}` : objectName;

    try {
      const metaData = {
        'Content-Type': mimetype,
        'X-Upload-Method': 'stream',
        'X-Upload-Date': new Date().toISOString(),
      };

      // Stream upload with proper part size
      await this.minioClient.putObject(
        bucket,
        fullObjectName,
        stream,
        size,
        metaData,
      );

      this.logger.log(`Fayl stream orqali yuklandi: ${fullObjectName} (${(size / 1024 / 1024).toFixed(2)}MB)`);

      return this.generatePresignedUrl(fullObjectName);
    } catch (error) {
      this.logger.error(`Stream orqali yuklashda xatolik: ${error.message}`, error.stack);
      throw new Error(`Stream orqali yuklashda xatolik: ${error.message}`);
    }
  }

  // Katta fayllar uchun multipart upload
  async uploadLargeFileStream(
    stream: Readable,
    size: number,
    mimetype: string,
    objectName: string,
    folder?: string,
  ): Promise<string> {
    const bucket = this.configService.get('minio.bucket');
    const fullObjectName = folder ? `${folder}/${objectName}` : objectName;

    try {
      const metaData = {
        'Content-Type': mimetype,
        'X-Upload-Method': 'large-stream-multipart',
        'X-Upload-Date': new Date().toISOString(),
        'X-File-Size': size.toString(),
      };

      // Katta fayllar uchun multipart upload
      await this.minioClient.putObject(
        bucket,
        fullObjectName,
        stream,
        undefined, // Don't specify size to use streaming mode
        metaData,
      );

      this.logger.log(`Katta fayl multipart orqali yuklandi: ${fullObjectName} (${(size / 1024 / 1024 / 1024).toFixed(2)}GB)`);

      return this.generatePresignedUrl(fullObjectName);
    } catch (error) {
      this.logger.error(`Katta fayl yuklashda xatolik: ${error.message}`, error.stack);
      throw new Error(`Katta fayl yuklashda xatolik: ${error.message}`);
    }
  }

  // True multipart upload for very large files using MinIO's fputObject
  async uploadLargeFileMultipart(
    req: any,
    res: any,
    mimetype: string,
    objectName: string,
    folder?: string,
  ): Promise<string> {
    const bucket = this.configService.get('minio.bucket');
    const fullObjectName = folder ? `${folder}/${objectName}` : objectName;

    try {
      // Create a temporary file path for the upload
      const os = require('os');
      const path = require('path');
      const fs = require('fs');
      const crypto = require('crypto');

      // Generate a unique temporary file name
      const tempFileName = path.join(
        os.tmpdir(),
        `minio-upload-${crypto.randomBytes(6).toString('hex')}`
      );

      // Create a write stream to the temporary file
      const writeStream = fs.createWriteStream(tempFileName);

      // Pipe the request to the temporary file
      req.pipe(writeStream);

      // Wait for the file to be fully written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        req.on('error', reject);
      });

      this.logger.log(`Temporary file created at: ${tempFileName}`);

      // Set metadata for the object
      const metaData = {
        'Content-Type': mimetype,
        'X-Upload-Method': 'true-multipart-file',
        'X-Upload-Date': new Date().toISOString(),
      };

      // Use fputObject which is optimized for large files and doesn't load the entire file into memory
      await this.minioClient.fPutObject(
        bucket,
        fullObjectName,
        tempFileName,
        metaData
      );

      this.logger.log(`Katta fayl true multipart orqali yuklandi: ${fullObjectName}`);

      // Clean up the temporary file
      fs.unlink(tempFileName, (err) => {
        if (err) {
          this.logger.error(`Temporary file cleanup error: ${err.message}`);
        } else {
          this.logger.log(`Temporary file removed: ${tempFileName}`);
        }
      });

      // Generate the URL for the uploaded file
      const url = await this.generatePresignedUrl(fullObjectName);

      // Send success response
      res.status(201).json({
        success: true,
        message: 'Katta fayl muvaffaqiyatli yuklandi',
        data: {
          url: url,
          objectName: fullObjectName,
        },
      });

      return url;
    } catch (error) {
      this.logger.error(`Katta fayl yuklashda xatolik: ${error.message}`, error.stack);
      throw new Error(`Katta fayl yuklashda xatolik: ${error.message}`);
    }
  }

  async generatePresignedUrl(objectName: string, expiry: number = 24 * 60 * 60): Promise<string> {
    const bucket = this.configService.get('minio.bucket');
    try {
      const url = await this.minioClient.presignedGetObject(
        bucket,
        objectName,
        expiry,
      );

      return url;
    } catch (error) {
      this.logger.error(`Presigned URL yaratishda xatolik: ${error.message}`);
      throw new Error(`URL yaratishda xatolik: ${error.message}`);
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    const bucket = this.configService.get('minio.bucket');
    try {
      await this.minioClient.removeObject(bucket, objectName);
      this.logger.log(`Fayl o'chirildi: ${objectName}`);
    } catch (error) {
      this.logger.error(`Fayl o'chirishda xatolik: ${error.message}`);
      throw new Error(`Fayl o'chirishda xatolik: ${error.message}`);
    }
  }

  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<any[]> {
    const bucket = this.configService.get('minio.bucket');
    const files: any[] = [];

    try {
      const stream = this.minioClient.listObjects(bucket, prefix, true);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (files.length < maxKeys) {
            files.push({
              name: obj.name,
              size: obj.size,
              lastModified: obj.lastModified,
              etag: obj.etag,
            });
          }
        });

        stream.on('end', () => {
          resolve(files);
        });

        stream.on('error', (error) => {
          this.logger.error(`Fayllarni ro'yxatlashda xatolik: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(`Fayllarni ro'yxatlashda xatolik: ${error.message}`);
      throw error;
    }
  }
}
