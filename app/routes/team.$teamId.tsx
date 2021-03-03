import { randomBytes } from 'crypto';

import * as React from 'react';
import type { MetaFunction } from '@remix-run/core';
import { redirect } from '@remix-run/data';
import { Form, useRouteData } from '@remix-run/react';

import { getSession } from '../sessions';
import type { RemixAction, RemixLoader } from '../context';

interface RouteData {
  team: {
    name: string;
    accessTokens: Array<string>;
  };
}

type Params = {
  teamId: string;
};

const loader: RemixLoader<RouteData, Params> = async ({
  request,
  context,
  params,
}) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');
  if (!userId) {
    return redirect('/login');
  }

  const team = await context.prisma.team.findFirst({
    where: {
      AND: [{ id: params.teamId }, { members: { some: { id: userId } } }],
    },
    select: {
      name: true,
      accessTokens: true,
    },
  });

  if (!team) {
    return new Response(JSON.stringify({}), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return { team };
};

const action: RemixAction<Params> = async ({ request, params, context }) => {
  // const session = await getSession(request.headers.get('Cookie'));
  // const req = await request.text();
  // const body = new URLSearchParams(req);
  const { pathname } = new URL(request.url);

  const accessTokenBuffer = randomBytes(20);
  const token = accessTokenBuffer.toString('hex');

  const team = await context.prisma.team.findUnique({
    where: { id: params.teamId },
    select: { accessTokens: true },
    rejectOnNotFound: true,
  });

  await context.prisma.team.update({
    where: { id: params.teamId },
    data: { accessTokens: { set: [...team?.accessTokens, token] } },
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
