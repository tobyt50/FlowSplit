import { Injectable, NotFoundException } from '@nestjs/common';
import { User, PrismaService } from '@flowsplit/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const { password, ...result } = user;
    return result;
  }
}