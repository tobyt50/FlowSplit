import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { cuid2Middleware } from './middlewares/cuid2.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
    this.$use(cuid2Middleware());
  }

  async onModuleInit() {
    await this.$connect();
  }
}