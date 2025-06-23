import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { minioConfig } from '../config/minio.config';

@Module({
  imports: [ConfigModule.forFeature(minioConfig)],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}