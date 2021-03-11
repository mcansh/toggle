import * as React from 'react';
import type { RouteComponent } from '@remix-run/react';
import { Link, useRouteData } from '@remix-run/react';
import type { FeatureChannel, Team } from '@prisma/client';
import { redirect } from '@remix-run/data';

import type { RemixContext, RemixLoader } from '../context';
import { commitSession, getSession } from '../sessions';

interface RouteData {
  user: {
    teams: Array<{
      id: Team['id'];
      name: Team['name'];
      slug: Team['slug'];
      featureChannels: Array<FeatureChannel>;
    }>;
  };
}

const loader: RemixLoader<RouteData> = async ({ request, context }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as RemixContext;
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

  return { user };
};

function meta() {
  return {
    title: 'Toggle',
    description: 'Welcome to Toggle!',
  };
}

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
