import { PrismaClient } from "@prisma/client";

export interface RemixContext {
  prisma: PrismaClient;
}
