import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined,
  pool: Pool | undefined,
  adapter: PrismaPg | undefined
};

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL;
  globalForPrisma.pool = new Pool({ connectionString });
  globalForPrisma.adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({
    adapter: globalForPrisma.adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma!;
