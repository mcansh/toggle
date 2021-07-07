import { PrismaClient } from '@prisma/client';
import { json } from 'remix-utils';

import { getSession } from '../../sessions';
import { convertFlagsArrayToObject } from '../utils';

const prisma = new PrismaClient();

async function getChannel(request: Request, params: { channel: string }) {
  const parsed = new URL(request.url);
  const raw = parsed.searchParams.has('raw');
  const { channel } = params;
  const authHeader = request.headers.get('Authorization');
  const authToken = authHeader ? authHeader.split('Bearer ')[1] : undefined;
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId') as string | undefined;

  const result = await prisma.featureChannel.findFirst({
    where: {
      AND: [
        {
          id: channel,
        },
        {
          team: authToken
            ? { accessTokens: { hasSome: authToken } }
            : { members: { some: { id: userId } } },
        },
      ],
    },
    select: {
      flags: {
        select: {
          feature: true,
          id: true,
          type: true,
          value: true,
        },
      },
      id: true,
      name: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!result) {
    return json(
      { message: 'Channel not found' },
      {
        status: 404,
      }
    );
  }

  if (raw) {
    return json(result, {
      status: 200,
    });
  }

  const flagObject = convertFlagsArrayToObject(result.flags as Array<any>);
  return json(
    { ...result, flags: flagObject },
    {
      status: 200,
    }
  );
}

export { getChannel };
