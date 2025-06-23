// This script creates a default admin user if it doesn't exist

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Starting admin user seeding...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (adminUser) {
      console.log('Admin user already exists');
      return;
    }

    // Check if admin role exists
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      console.log('Admin role does not exist, creating...');
      
      // Create basic permissions
      const permissions = await createBasicPermissions(prisma);
      
      // Create admin role with all permissions
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator with full access',
          permissions: {
            create: permissions.map(permission => ({
              permission: {
                connect: {
                  id: permission.id,
                },
              },
            })),
          },
        },
      });
      
      console.log(`Admin role created with ID: ${adminRole.id}`);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        isActive: true,
        roleId: adminRole.id,
      },
    });
    
    console.log(`Admin user created with ID: ${user.id}`);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBasicPermissions(prisma) {
  const basicPermissions = [
    { name: 'Create User', key: 'users:create', module: 'users', description: 'Permission to create users' },
    { name: 'Read User', key: 'users:read', module: 'users', description: 'Permission to read users' },
    { name: 'Update User', key: 'users:update', module: 'users', description: 'Permission to update users' },
    { name: 'Delete User', key: 'users:delete', module: 'users', description: 'Permission to delete users' },
    { name: 'Create Role', key: 'roles:create', module: 'roles', description: 'Permission to create roles' },
    { name: 'Read Role', key: 'roles:read', module: 'roles', description: 'Permission to read roles' },
    { name: 'Update Role', key: 'roles:update', module: 'roles', description: 'Permission to update roles' },
    { name: 'Delete Role', key: 'roles:delete', module: 'roles', description: 'Permission to delete roles' },
    { name: 'Create Permission', key: 'permissions:create', module: 'permissions', description: 'Permission to create permissions' },
    { name: 'Read Permission', key: 'permissions:read', module: 'permissions', description: 'Permission to read permissions' },
    { name: 'Update Permission', key: 'permissions:update', module: 'permissions', description: 'Permission to update permissions' },
    { name: 'Delete Permission', key: 'permissions:delete', module: 'permissions', description: 'Permission to delete permissions' },
  ];

  const createdPermissions = [];

  for (const permissionData of basicPermissions) {
    // Check if permission already exists
    let permission = await prisma.permission.findFirst({
      where: {
        OR: [
          { name: permissionData.name },
          { key: permissionData.key },
        ],
      },
    });

    if (!permission) {
      // Create permission if it doesn't exist
      permission = await prisma.permission.create({
        data: permissionData,
      });
      console.log(`Created permission: ${permission.name}`);
    }

    createdPermissions.push(permission);
  }

  return createdPermissions;
}

main()
  .then(() => {
    console.log('Admin user seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during admin user seeding:', error);
    process.exit(1);
  });