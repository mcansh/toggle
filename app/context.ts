import type { PrismaClient } from '@prisma/client';
import type { ActionFunction, LoaderFunction } from '@remix-run/core';
import type { Except } from 'type-fest';

export interface RemixContext {
  prisma: PrismaClient;
}

export type RemixLoader<
  AppData extends Record<string, any> = Record<string, any>,
  Params extends Record<string, string> = Record<string, string>
> = (
  args: Except<Parameters<LoaderFunction>['0'], 'context' | 'params'> & {
    context: RemixContext;
    params: Params;
  }
) => AppData | Promise<AppData>;

export type RemixAction<
  Params extends Record<string, string> = Record<string, string>
> = (
  args: Except<Parameters<ActionFunction>['0'], 'context' | 'params'> & {
    context: RemixContext;
    params: Params;
  }
) => ReturnType<ActionFunction>;
