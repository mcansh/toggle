import * as React from 'react';
import { redirect, Form, usePendingFormSubmit, useRouteData } from 'remix';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { json } from 'remix-utils';

import { Button } from '../components/button';
import { Input, InputLabel } from '../components/input';
import { generateName } from '../lib/name-generator';
import { getSession } from '../sessions';
import { prisma } from '../db';

import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  RouteComponent,
} from 'remix';

const teamIdAndName = Prisma.validator<Prisma.TeamArgs>()({
  select: { name: true, id: true },
});

type TeamIdAndName = Prisma.FeatureChannelGetPayload<typeof teamIdAndName>;

interface RouteData {
  teams: Array<TeamIdAndName>;
}

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  if (!userId) {
    return redirect('/login');
  }

  const userWithTeams = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      teams: { select: { name: true, id: true } },
    },
  });

  if (!userWithTeams) return json<RouteData>({ teams: [] });
  return json<RouteData>({ teams: userWithTeams.teams });
};

const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  if (!userId) {
    return redirect('/login');
  }

  const req = await request.text();
  const body = new URLSearchParams(req);

  const name = body.get('channelName') as string;
  const teamId = body.get('teamId') as string;

  if (!name) {
    return redirect('/channels/create');
  }

  const slug = slugify(name, { lower: true });

  const possibleNewTeamName = generateName();

  await prisma.featureChannel.create({
    data: {
      name,
      slug,
      team: {
        connectOrCreate: {
          where: {
            id: teamId,
          },
          create: {
            name: possibleNewTeamName,
            slug: slugify(possibleNewTeamName, { lower: true }),
            createdBy: {
              connect: {
                id: userId,
              },
            },
            members: {
              connect: {
                id: userId,
              },
            },
          },
        },
      },
    },
  });

  return redirect('/');
};

const meta: MetaFunction = () => ({
  title: 'Hello World!',
});

const Page: RouteComponent = () => {
  const pendingForm = usePendingFormSubmit();
  const data = useRouteData<RouteData>();

  return (
    <div>
      <Form method="post">
        <fieldset disabled={!!pendingForm} className="py-2 space-y-2">
          <Input
            label="Channel Name"
            name="channelName"
            placeholder="The cool kids"
          />
          <InputLabel label="Select a team" id="teamId">
            <select
              id="teamId"
              name="teamId"
              className="w-full px-3 py-1.5 mx-0 mt-1 text-sm border border-gray-300 rounded-md cursor-text appearance-none"
            >
              <option value="">Create new team</option>
              {data.teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </InputLabel>
          <Button variant="primary" type="submit">
            Create team
          </Button>
        </fieldset>
      </Form>
    </div>
  );
};

export default Page;
export { loader, meta, action };
