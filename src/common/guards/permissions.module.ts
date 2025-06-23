import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class PermissionsGuardModule {}