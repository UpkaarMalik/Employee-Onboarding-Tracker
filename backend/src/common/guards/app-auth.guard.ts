import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_PASSWORD_CHECK_KEY } from '../decorators/skip-password-check.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Role, Permission, roleHasPermission } from '../../rbac/permission-map';

interface AccessTokenPayload {
  sub: string;
  role: Role;
  jti: string;
  mustChangePassword: boolean;
  exp: number;
}

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const handler = context.getHandler();
    const cls = context.getClass();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      cls,
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.slice('Bearer '.length);

    let payload: AccessTokenPayload;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const blacklisted = await this.authService.isBlacklisted(payload.jti);
    if (blacklisted) {
      throw new UnauthorizedException('Session has been invalidated');
    }

    // Attach the authenticated user to the request — everything below this
    // point can now safely assume request.user exists.
    request.user = {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
      mustChangePassword: payload.mustChangePassword,
    };

    const skipPasswordCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_PASSWORD_CHECK_KEY,
      [handler, cls],
    );
    if (!skipPasswordCheck && payload.mustChangePassword) {
      throw new ForbiddenException(
        'You must change your password before accessing this resource',
      );
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      handler,
      cls,
    ]);
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [handler, cls],
    );
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAll = requiredPermissions.every((perm) =>
        roleHasPermission(payload.role, perm),
      );
      if (!hasAll) {
        throw new ForbiddenException('You do not have permission to perform this action');
      }
    }

    return true;
  }
}