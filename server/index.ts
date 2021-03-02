import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import { PrismaClient } from '@prisma/client';

import { getSession } from '../app/sessions';

import { convertFlagsArrayToObject } from './utils';

const app = express();

const allowAPIForUsers = new Set([
  'ckjnabahm0025raispjnm0lfa',
  'ckjp27llc039728r9pew5ibpp',
  'cklmjgcsa0000n8isz3smllpx',
]);

const prisma = new PrismaClient();

app.use(express.static('public'));

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

app.get<Params, Result, any, Query>(
  '/api/channel/:channel',
  async (req, res) => {
    const { channel } = req.params;
    const { raw } = req.query;
    const session = await getSession(req.headers.cookie);
    const userId = session.get('userId');
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowAPIForUsers.has(userId)) {
      return res.status(501).json({
        message: "our api isn't quite ready for you yet",
      });
    }

    const result = await prisma.featureChannel.findFirst({
      where: {
        id: channel,
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

    if (!result) return res.status(404).end();

    if (raw === 'true') {
      return res.status(200).json(result);
    }

    const flagObject = convertFlagsArrayToObject(result.flags);

    return res.status(200).json({ ...result, flags: flagObject });
  }
);

app.all(
  '*',
  createRequestHandler({
    getLoadContext() {
      return { prisma };
    },
  })
);

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express server started on http://localhost:${port}`);
});
