import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MinioModule } from './minio/minio.module';
import { UploadModule } from './upload/upload.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { JournalsModule } from './journals/journals.module';
import { ApprovalWorkflowsModule } from './approval-workflows/approval-workflows.module';
import { StatisticsModule } from './statistics/statistics.module';
import { DepartmentsModule } from './departments/departments.module';
import { PermissionsGuardModule } from './common/guards/permissions.module';
import { minioConfig } from './config/minio.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [minioConfig],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    MinioModule,
    UploadModule,
    DocumentsModule,
    DocumentTypesModule,
    JournalsModule,
    ApprovalWorkflowsModule,
    StatisticsModule,
    DepartmentsModule,
    PermissionsGuardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
