import type { RequestHandler } from 'express';

import { getSession } from '../../app/sessions';
import { prisma } from '../prisma';
import { convertFlagsArrayToObject } from '../utils';

interface Params {
  channel: string;
}

interface Query {
  raw: string;
}

type Result =
  | { message: string }
  | {
      flags: {
        [key: string]: string | number | boolean;
      };
      id: string;
      name: string;
      updatedAt: Date;
      createdAt: Date;
    }
  | {
      id: string;
      name: string;
      updatedAt: Date;
      createdAt: Date;
      flags: Array<{
        feature: string;
        type: string;
        id: string;
        value: string;
      }>;
    };

const getChannel: RequestHandler<Params, Result, any, Query> = async (
  req,
  res
) => {
  const { channel } = req.params;
  const { raw } = req.query;
  const authToken = req.headers.authorization
    ? req.headers.authorization.split('Bearer ')[1]
    : undefined;

  const session = await getSession(req.headers.cookie);
  const userId = session.get('userId');

  const result = await prisma.featureChannel.findFirst({
    where: {
      AND: [
        {
          id: channel,
        },
        {
          team: authToken
            ? { accessTokens: { hasSome: authToken } }
            : {
                members: { some: { id: userId } },
              },
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

  if (!result)
    return res.status(404).json({
      message: 'Channel not found',
    });

  if (raw === 'true') {
    return res.status(200).json(result);
  }

  const flagObject = convertFlagsArrayToObject(result.flags);

  return res.status(200).json({ ...result, flags: flagObject });
};

export { getChannel };
