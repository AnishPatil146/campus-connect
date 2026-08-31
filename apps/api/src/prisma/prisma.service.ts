import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    super({
      datasources: {
        db: { url },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Connected to Neon PostgreSQL (PgBouncer pooler).');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
