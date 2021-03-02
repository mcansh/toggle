import type { FeatureChannel, Team } from '@prisma/client';
import type { RequestHandler } from 'express';

import { getSession } from '../../app/sessions';
import { prisma } from '../prisma';

interface ErrorResult {
  message: string;
}

interface SuccessResult {
  teams: Array<
    Pick<Team, 'id' | 'name'> & {
      featureChannels: Array<
        Pick<FeatureChannel, 'id' | 'name' | 'slug'> & {
          flags: number;
        }
      >;
    }
  >;
}

type Result = SuccessResult | ErrorResult;

const getUserChannels: RequestHandler<null, Result> = async (req, res) => {
  const session = await getSession(req.headers.cookie);
  const userId = session.get('userId');

  const result = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      teams: {
        select: {
          id: true,
          name: true,
          featureChannels: {
            select: {
              id: true,
              name: true,
              slug: true,
              flags: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    return res.status(404).end();
  }

  return res.status(200).json({
    ...result,
    teams: result.teams.map(team => ({
      ...team,
      featureChannels: team.featureChannels.map(channel => ({
        ...channel,
        flags: channel.flags.length,
      })),
    })),
  });
};

export { getUserChannels };
