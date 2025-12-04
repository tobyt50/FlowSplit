import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, Role, User, UserStatus } from '@flowsplit/prisma';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches a paginated list of all users in the system.
   * Production-grade: includes pagination to handle millions of users.
   */
  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { wallets: true, transactions: true } }
        },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches the full, detailed profile of a single user, including their wallets, 
   * recent transactions, bank accounts, and split rules.
   */
  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: { 
          orderBy: { createdAt: 'asc' } 
        },
        bankAccounts: { 
          select: { 
            id: true, 
            bankName: true, 
            accountNumber: true, 
            accountName: true, 
            isVerified: true 
          }
        },
        transactions: { 
          orderBy: { initiatedAt: 'desc' }, 
          take: 10 
        },
        splitRules: {
          orderBy: { priority: 'asc' }
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // Never expose the password hash, even to admins.
    const { password, ...result } = user;
    return result;
  }

  /**
   * Updates the status of a user, with critical safety checks.
   */
  async updateUserStatus(
    targetUserId: string,
    status: UserStatus,
    performingAdmin: User
  ) {
    const userToUpdate = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!userToUpdate) {
      throw new NotFoundException(`User with ID ${targetUserId} not found.`);
    }
    
    if (userToUpdate.id === performingAdmin.id) {
      throw new ForbiddenException('Administrators cannot change their own status.');
    }

    if (userToUpdate.role === Role.ADMIN || userToUpdate.role === Role.SUPER_ADMIN) {
      if (performingAdmin.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('You do not have sufficient privileges to modify an administrator account.');
      }
    }
    
    if (userToUpdate.role === Role.SUPER_ADMIN) {
        throw new ForbiddenException('Super administrator accounts cannot be suspended.');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
    });
  }
}