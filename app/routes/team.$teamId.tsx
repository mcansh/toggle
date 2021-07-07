import * as React from 'react';
import { redirect, Form, useRouteData } from 'remix';
import { json } from 'remix-utils';
import { Prisma } from '@prisma/client';

import { getSession } from '../sessions';
import { prisma } from '../db';

import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix';

const teamWithNameAndAccessToken = Prisma.validator<Prisma.TeamArgs>()({
  select: { name: true, accessTokens: true },
});

type TeamWithNameAndAccessToken = Prisma.TeamGetPayload<
  typeof teamWithNameAndAccessToken
>;

interface RouteData {
  team?: TeamWithNameAndAccessToken;
}

const loader: LoaderFunction = async ({ request, params }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  if (!userId) {
    return redirect('/login');
  }

  const team = await prisma.team.findFirst({
    where: {
      AND: [{ id: params.teamId }, { members: { some: { id: userId } } }],
    },
    select: {
      name: true,
      accessTokens: true,
    },
  });

  if (!team) {
    return json<RouteData>({}, { status: 404 });
  }

  return json<RouteData>({ team });
};

const action: ActionFunction = async ({ request, params }) => {
  const crypto = await import('crypto');
  // const session = await getSession(request.headers.get('Cookie'));
  // const req = await request.text();
  // const body = new URLSearchParams(req);
  const { pathname } = new URL(request.url);

  const accessTokenBuffer = crypto.randomBytes(20);
  const token = accessTokenBuffer.toString('hex');

  await prisma.team.update({
    where: { id: params.teamId },
    data: { accessTokens: { push: token } },
  });

  return redirect(pathname);
};

const meta: MetaFunction = ({ data }: { data: RouteData }) => ({
  title: data.team ? data.team.name : 'Team not found',
});

const TeamPage: React.VFC = () => {
  const data = useRouteData<RouteData>();
  if (!data.team) return <h1>oh no!</h1>;
  return (
    <div>
      <h1>{data.team.name}</h1>
      <Form method="post">
        <button type="submit">Generate Access Token</button>
      </Form>

      <ul>
        {data.team.accessTokens.map(token => (
          <li key={token}>
            <input
              type="text"
              readOnly
              value={token}
              onClick={event => {
                event.currentTarget.select();
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamPage;
export { meta, loader, action };
