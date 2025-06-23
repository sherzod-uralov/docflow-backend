import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Define interface for Permission based on Prisma schema
interface Permission {
  id: number;
  name: string;
  description: string | null;
  key: string;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedAdminUser() {
    this.logger.log('Checking if admin user exists...');

    try {
      // Check if admin user exists
      const adminUser = await this.prisma.user.findUnique({
        where: { username: 'admin' },
      });

      if (adminUser) {
        this.logger.log('Admin user already exists');
        return;
      }

      // Check if admin role exists
      let adminRole = await this.prisma.role.findUnique({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        this.logger.log('Admin role does not exist, creating...');

        // Create basic permissions
        const permissions = await this.createBasicPermissions();
        adminRole = await this.prisma.role.create({
          data: {
            name: 'admin',
            description: 'Administrator with full access',
            permissions: {
              create: permissions.map((permission: Permission) => ({
                permission: {
                  connect: {
                    id: permission.id,
                  },
                },
              })),
            },
          },
        });

        this.logger.log(`Admin role created with ID: ${adminRole.id}`);
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash('admin', 10);

      const user = await this.prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          isActive: true,
          roleId: adminRole.id,
        },
      });

      this.logger.log(`Admin user created with ID: ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to seed admin user', error.stack);
      throw error;
    }
  }

  private async createBasicPermissions(): Promise<Permission[]> {
    const basicPermissions = [
      // User permissions
      {
        name: 'Create User',
        key: 'users:create',
        module: 'users',
        description: 'Permission to create users',
      },
      {
        name: 'Read User',
        key: 'users:read',
        module: 'users',
        description: 'Permission to read users',
      },
      {
        name: 'Update User',
        key: 'users:update',
        module: 'users',
        description: 'Permission to update users',
      },
      {
        name: 'Delete User',
        key: 'users:delete',
        module: 'users',
        description: 'Permission to delete users',
      },
      {
        name: 'All User Permissions',
        key: 'users:*',
        module: 'users',
        description: 'All permissions related to users',
      },

      // Role permissions
      {
        name: 'Create Role',
        key: 'roles:create',
        module: 'roles',
        description: 'Permission to create roles',
      },
      {
        name: 'Read Role',
        key: 'roles:read',
        module: 'roles',
        description: 'Permission to read roles',
      },
      {
        name: 'Update Role',
        key: 'roles:update',
        module: 'roles',
        description: 'Permission to update roles',
      },
      {
        name: 'Delete Role',
        key: 'roles:delete',
        module: 'roles',
        description: 'Permission to delete roles',
      },
      {
        name: 'All Role Permissions',
        key: 'roles:*',
        module: 'roles',
        description: 'All permissions related to roles',
      },

      // Permission permissions
      {
        name: 'Create Permission',
        key: 'permissions:create',
        module: 'permissions',
        description: 'Permission to create permissions',
      },
      {
        name: 'Read Permission',
        key: 'permissions:read',
        module: 'permissions',
        description: 'Permission to read permissions',
      },
      {
        name: 'Update Permission',
        key: 'permissions:update',
        module: 'permissions',
        description: 'Permission to update permissions',
      },
      {
        name: 'Delete Permission',
        key: 'permissions:delete',
        module: 'permissions',
        description: 'Permission to delete permissions',
      },
      {
        name: 'Assign Permission',
        key: 'permissions:assign',
        module: 'permissions',
        description: 'Permission to assign permissions to users',
      },
      {
        name: 'All Permission Permissions',
        key: 'permissions:*',
        module: 'permissions',
        description: 'All permissions related to permissions',
      },

      // Statistics permissions
      {
        name: 'Read Statistics',
        key: 'statistics:read',
        module: 'statistics',
        description: 'Permission to view system statistics',
      },
      {
        name: 'All Statistics Permissions',
        key: 'statistics:*',
        module: 'statistics',
        description: 'All permissions related to statistics',
      },

      // Department permissions
      {
        name: 'Create Department',
        key: 'departments:create',
        module: 'departments',
        description: 'Permission to create departments',
      },
      {
        name: 'Read Department',
        key: 'departments:read',
        module: 'departments',
        description: 'Permission to read departments',
      },
      {
        name: 'Update Department',
        key: 'departments:update',
        module: 'departments',
        description: 'Permission to update departments',
      },
      {
        name: 'Delete Department',
        key: 'departments:delete',
        module: 'departments',
        description: 'Permission to delete departments',
      },
      {
        name: 'All Department Permissions',
        key: 'departments:*',
        module: 'departments',
        description: 'All permissions related to departments',
      },

      // Document permissions
      {
        name: 'Create Document',
        key: 'documents:create',
        module: 'documents',
        description: 'Permission to create documents',
      },
      {
        name: 'Read Document',
        key: 'documents:read',
        module: 'documents',
        description: 'Permission to read documents',
      },
      {
        name: 'Update Document',
        key: 'documents:update',
        module: 'documents',
        description: 'Permission to update documents',
      },
      {
        name: 'Delete Document',
        key: 'documents:delete',
        module: 'documents',
        description: 'Permission to delete documents',
      },
      {
        name: 'All Document Permissions',
        key: 'documents:*',
        module: 'documents',
        description: 'All permissions related to documents',
      },

      // Document Type permissions
      {
        name: 'Create Document Type',
        key: 'document-types:create',
        module: 'document-types',
        description: 'Permission to create document types',
      },
      {
        name: 'Read Document Type',
        key: 'document-types:read',
        module: 'document-types',
        description: 'Permission to read document types',
      },
      {
        name: 'Update Document Type',
        key: 'document-types:update',
        module: 'document-types',
        description: 'Permission to update document types',
      },
      {
        name: 'Delete Document Type',
        key: 'document-types:delete',
        module: 'document-types',
        description: 'Permission to delete document types',
      },
      {
        name: 'All Document Type Permissions',
        key: 'document-types:*',
        module: 'document-types',
        description: 'All permissions related to document types',
      },

      // Journal permissions
      {
        name: 'Create Journal',
        key: 'journals:create',
        module: 'journals',
        description: 'Permission to create journals',
      },
      {
        name: 'Read Journal',
        key: 'journals:read',
        module: 'journals',
        description: 'Permission to read journals',
      },
      {
        name: 'Update Journal',
        key: 'journals:update',
        module: 'journals',
        description: 'Permission to update journals',
      },
      {
        name: 'Delete Journal',
        key: 'journals:delete',
        module: 'journals',
        description: 'Permission to delete journals',
      },
      {
        name: 'All Journal Permissions',
        key: 'journals:*',
        module: 'journals',
        description: 'All permissions related to journals',
      },

      // Approval Workflow permissions
      {
        name: 'Create Approval Workflow',
        key: 'approval-workflows:create',
        module: 'approval-workflows',
        description: 'Permission to create approval workflows',
      },
      {
        name: 'Read Approval Workflow',
        key: 'approval-workflows:read',
        module: 'approval-workflows',
        description: 'Permission to read approval workflows',
      },
      {
        name: 'Update Approval Workflow',
        key: 'approval-workflows:update',
        module: 'approval-workflows',
        description: 'Permission to update approval workflows',
      },
      {
        name: 'Delete Approval Workflow',
        key: 'approval-workflows:delete',
        module: 'approval-workflows',
        description: 'Permission to delete approval workflows',
      },
      {
        name: 'All Approval Workflow Permissions',
        key: 'approval-workflows:*',
        module: 'approval-workflows',
        description: 'All permissions related to approval workflows',
      },

      // Action-based wildcard permissions
      {
        name: 'Create Any Resource',
        key: '*:create',
        module: 'system',
        description: 'Permission to create any resource',
      },
      {
        name: 'Read Any Resource',
        key: '*:read',
        module: 'system',
        description: 'Permission to read any resource',
      },
      {
        name: 'Update Any Resource',
        key: '*:update',
        module: 'system',
        description: 'Permission to update any resource',
      },
      {
        name: 'Delete Any Resource',
        key: '*:delete',
        module: 'system',
        description: 'Permission to delete any resource',
      },

      // Super admin permission
      {
        name: 'All Permissions',
        key: '*',
        module: 'system',
        description: 'All permissions in the system',
      },
    ];

    const createdPermissions: Permission[] = [];

    for (const permissionData of basicPermissions) {
      // Check if permission already exists
      let permission: Permission | null = await this.prisma.permission.findFirst({
        where: {
          OR: [{ name: permissionData.name }, { key: permissionData.key }],
        },
      });

      if (!permission) {
        permission = await this.prisma.permission.create({
          data: permissionData,
        });
        if (permission) {
          this.logger.log(`Created permission: ${permission.name}`);
        }
      }

      if (permission) {
        createdPermissions.push(permission);
      }
    }

    return createdPermissions;
  }
}
