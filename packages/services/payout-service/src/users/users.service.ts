import { Injectable } from '@nestjs/common';
import { PrismaService } from '@flowsplit/prisma';

/**
 * A minimal service to allow the JwtStrategy to validate a user's existence.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}