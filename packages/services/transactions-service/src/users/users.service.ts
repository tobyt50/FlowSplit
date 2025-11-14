import { Injectable } from '@nestjs/common';
import { PrismaService } from '@flowsplit/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}