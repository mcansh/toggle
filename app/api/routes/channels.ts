import { PrismaClient } from '@prisma/client';

import { getSession } from '../../sessions';

const prisma = new PrismaClient();

async function getUserChannels(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
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
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.stringify({
      ...result,
      teams: result.teams.map(team => ({
        ...team,
        featureChannels: team.featureChannels.map(channel => ({
          ...channel,
          flags: channel.flags.length,
        })),
      })),
    });

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { getUserChannels };
