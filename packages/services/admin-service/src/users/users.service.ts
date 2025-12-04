import { Injectable } from '@nestjs/common';
import { PrismaService } from '@flowsplit/prisma';

/**
 * A minimal service to allow the shared JwtStrategy to validate
 * the existence and retrieve the role of a user from the token payload.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a user by their ID. This is required by the JwtStrategy.
   * @param id The user's ID from the JWT 'sub' claim.
   */
  async findOneById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}