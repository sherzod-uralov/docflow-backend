# Enhanced Permission System Documentation

## Overview

The DocFlow application uses a powerful and flexible permission system that allows for fine-grained access control. This document explains how the permission system works and how to use it effectively.

## Permission Structure

Permissions in DocFlow follow a structured naming convention:

```
module:action
```

For example:
- `users:create` - Permission to create users
- `documents:read` - Permission to read documents

### Special Permission Types

#### Wildcard Permissions

The system supports wildcard permissions for more flexible access control:

1. **Module Wildcards**: Grant all permissions for a specific module
   - Example: `users:*` grants all permissions related to users (create, read, update, delete)

2. **Action Wildcards**: Grant a specific action across all modules
   - Example: `*:read` grants read permission for all modules

3. **Super Wildcard**: Grants all permissions in the system
   - Example: `*` grants all permissions

#### Resource-Specific Permissions

Permissions can be scoped to specific resources:

- A user can be granted permission to access only specific documents
- Example: Permission to read only documents in a specific department

#### Temporary Permissions

Permissions can be granted temporarily:

- Permissions can have an expiration date
- After the expiration date, the permission is automatically revoked

#### Conditional Permissions

Permissions can be granted with conditions:

- Conditions are evaluated at runtime
- Example: Allow access only if the user is the owner of the resource

## Permission Inheritance

Permissions can inherit from other permissions:

- A parent permission can grant access to multiple child permissions
- Example: `documents:*` (parent) grants access to `documents:read`, `documents:create`, etc.

## Permission Assignment

Permissions can be assigned in two ways:

1. **Role-based permissions**: Permissions assigned to roles, and roles assigned to users
2. **Direct user permissions**: Permissions assigned directly to users

Direct user permissions take precedence over role-based permissions.

## Using Permissions in Controllers

To protect an endpoint with permissions:

```typescript
@Get()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@HasPermission('documents:read')
findAll() {
  // This endpoint requires 'documents:read' permission
  return this.documentsService.findAll();
}
```

Multiple permissions can be required:

```typescript
@Post()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@HasPermission('documents:create', 'documents:read')
create(@Body() createDocumentDto: CreateDocumentDto) {
  // This endpoint requires both 'documents:create' and 'documents:read' permissions
  return this.documentsService.create(createDocumentDto);
}
```

## Permission Management API

The system provides REST API endpoints for managing permissions:

### Permission CRUD

- `GET /permissions` - Get all permissions
- `GET /permissions/:id` - Get a permission by ID
- `POST /permissions` - Create a new permission
- `PATCH /permissions/:id` - Update a permission
- `DELETE /permissions/:id` - Delete a permission

### User Permission Management

- `POST /permissions/users` - Assign a permission to a user
- `DELETE /permissions/users/:userId/permissions/:permissionId` - Remove a permission from a user
- `GET /permissions/users/:userId` - Get all permissions for a user
- `GET /permissions/check/:userId/:permissionKey` - Check if a user has a specific permission

## Examples

### Creating a Resource-Specific Permission

```typescript
// Assign permission to read only a specific document
const assignDto = {
  userId: 1,
  permissionId: 5, // documents:read permission
  resourceType: 'document',
  resourceId: '42',
  expiresAt: '2023-12-31T23:59:59Z' // Optional expiration date
};

// POST to /permissions/users
```

### Creating a Conditional Permission

```typescript
// Assign permission with conditions
const assignDto = {
  userId: 1,
  permissionId: 5, // documents:read permission
  conditions: {
    requireResourceMatch: true,
    resourceType: 'document',
    resourceId: '*' // Any document
  }
};

// POST to /permissions/users
```

### Checking Permissions in Services

```typescript
// Inject the PermissionsService
constructor(private readonly permissionsService: PermissionsService) {}

// Check if a user has permission to access a resource
async canUserAccessDocument(userId: number, documentId: string): Promise<boolean> {
  return this.permissionsService.checkUserPermission(
    userId,
    'documents:read',
    { resourceType: 'document', resourceId: documentId }
  );
}
```

## Best Practices

1. **Use role-based permissions** for general access control
2. **Use direct user permissions** for exceptions or temporary access
3. **Use resource-specific permissions** for fine-grained access control
4. **Use wildcard permissions** sparingly and only for trusted roles
5. **Set expiration dates** for temporary permissions
6. **Check permissions in services** for complex business logic
7. **Log permission checks** for security auditing