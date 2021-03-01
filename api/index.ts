import type { NowApiHandler } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

import { getSession } from '../app/sessions';

import { convertFlagsArrayToObject } from './_utils';

const prisma = new PrismaClient();

const allowAPIForUsers = new Set([
  'ckjnabahm0025raispjnm0lfa',
  'ckjp27llc039728r9pew5ibpp',
  'cklmjgcsa0000n8isz3smllpx',
]);

const handler: NowApiHandler = async (req, res) => {
  const session = await getSession(req.headers.cookie);
  const { channelId, makeObject } = req.query;

  const userId = session.get('userId');

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!allowAPIForUsers.has(userId)) {
    return res.status(501).json({
      message: "our api isn't quite ready for you yet",
    });
  }

  if (!channelId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        teams: {
          select: {
            featureChannels: {
              select: {
                id: true,
                name: true,
                flags: {
                  select: {
                    feature: true,
                    id: true,
                    type: true,
                    value: true,
                  },
                },
              },
            },
          },
        },
        username: true,
      },
    });

    return res.status(200).json(user);
  }

  const channel = await prisma.featureChannel.findFirst({
    where: {
      id: Array.isArray(channelId) ? channelId[0] : channelId,
      team: {
        members: {
          some: { id: userId },
        },
      },
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

  if (!channel) return res.status(404).end();

  if (makeObject) {
    const flagObject = convertFlagsArrayToObject(channel.flags);

    return res.status(200).json({ ...channel, flags: flagObject });
  }

  return res.status(200).json(channel);
};

export default handler;