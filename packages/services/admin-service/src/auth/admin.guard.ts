import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@flowsplit/prisma';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed.');
    }
    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied. Administrator privileges are required.');
    }
    
    return user;
  }
}