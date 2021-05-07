import * as React from 'react';
import type { MetaFunction, RouteComponent, LoaderFunction } from 'remix';
import { Link, useRouteData, redirect } from 'remix';
import { Prisma } from '@prisma/client';
import { json } from 'remix-utils';

import { commitSession, getSession } from '../sessions';
import { prisma } from '../db';

const userTeams = Prisma.validator<Prisma.UserArgs>()({
  select: {
    teams: {
      select: {
        name: true,
        slug: true,
        id: true,
        featureChannels: true,
      },
    },
  },
});

type UserTeams = Prisma.UserGetPayload<typeof userTeams>;

interface RouteData {
  user: UserTeams;
}

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));

  const userId = session.get('userId');

  if (!userId) {
    session.set('returnTo', '/');
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      teams: {
        select: {
          name: true,
          slug: true,
          id: true,
          featureChannels: true,
        },
      },
    },
  });

  if (!user) {
    session.unset('userId');
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  return json<RouteData>({ user });
};

const meta: MetaFunction = () => ({
  title: 'Toggle',
  description: 'Welcome to Toggle!',
});

const IndexPage: RouteComponent = () => {
  const data = useRouteData<RouteData>();

  return (
    <div>
      <h1>Teams</h1>

      {data.user.teams.length > 0 ? (
        <ul>
          {data.user.teams.map(team => (
            <li key={team.id}>
              <div>
                <Link to={`/team/${team.id}`}>{team.name}</Link>
                <ul>
                  {team.featureChannels.map(channel => (
                    <li key={channel.id}>
                      <Link to={`/channel/${team.id}/${channel.slug}`}>
                        {channel.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link className="pl-4 text-indigo-500" to="/channels/create">
                  {'> '}Create a new channel
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          You don&apos;t belong to any teams,{' '}
          <Link to="/teams/new">create a new one</Link>
        </p>
      )}
    </div>
  );
};

export default IndexPage;
export { loader, meta };
