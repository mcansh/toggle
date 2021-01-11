import type { PrismaClient } from '@prisma/client';

export interface RemixContext {
  prisma: PrismaClient;
}
