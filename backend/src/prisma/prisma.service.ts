import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    const isCloudDb = Boolean(
      connectionString &&
      (connectionString.includes('supabase.co') ||
        connectionString.includes('supabase.com') ||
        connectionString.includes('neon.tech') ||
        connectionString.includes('sslmode=require') ||
        process.env.DATABASE_SSL === 'true'),
    );
    const pool = new Pool({
      connectionString,
      ...(isCloudDb ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
