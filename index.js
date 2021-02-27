import { createRequestHandler } from '@remix-run/vercel';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };

module.exports = createRequestHandler({
  getLoadContext() {
    return { prisma };
  },
});
