import { Request } from 'express';
import { User as PrismaUser } from '@flowsplit/prisma';

export type User = Omit<PrismaUser, 'password'>;

export interface AuthenticatedRequest extends Request {
  user: User;
}