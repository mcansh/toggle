import type { PrismaClient } from '@prisma/client';
import type { ActionFunction, LoaderFunction } from '@remix-run/core';

export interface RemixContext {
  prisma: PrismaClient;
}

export type RemixLoader = (
  args: Omit<Parameters<LoaderFunction>['0'], 'context'> & {
    context: RemixContext;
  }
) => ReturnType<LoaderFunction>;

export type RemixAction = (
  args: Omit<Parameters<ActionFunction>['0'], 'context'> & {
    context: RemixContext;
  }
) => ReturnType<ActionFunction>;
