import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HAS_PERMISSION_KEY } from '../decorators/has-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required permissions from the route handler
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      HAS_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get the user from the request object
    const { user } = context.switchToHttp().getRequest();

    // If no user is present, deny access
    if (!user) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    // Check if the user has the required permissions
    const hasPermission = this.checkPermissions(user, requiredPermissions);

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }

  private checkPermissions(user: any, requiredPermissions: string[]): boolean {
    // If the user doesn't have a role or the role doesn't have permissions, deny access
    if (
      !user.role ||
      !user.role.permissions ||
      user.role.permissions.length === 0
    ) {
      return false;
    }

    // Get the user's permissions
    const userPermissions = user.role.permissions.map((p) => p.key);

    // Check if the user has all the required permissions
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}