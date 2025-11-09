import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@flowsplit/prisma';

/**
 * This custom decorator extracts the user object from the request.
 * It's populated by the JwtStrategy's validate() method.
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);