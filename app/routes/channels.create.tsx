import * as React from 'react';
import type { MetaFunction, RouteComponent } from '@remix-run/core';
import { redirect } from '@remix-run/data';
import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import slugify from 'slugify';
import type { Team } from '@prisma/client';

import { verifyAuth } from '../lib/verify-auth';
import type { RemixAction, RemixLoader } from '../context';
import { Button } from '../components/button';
import { Input, InputLabel } from '../components/input';
import { generateName } from '../lib/name-generator';

interface RouteData {
  teams: Array<{
    id: Team['id'];
    name: Team['name'];
  }>;
}

const loader: RemixLoader<RouteData> = async args => {
  const user = await verifyAuth(args);
  const userWithTeams = await args.context.prisma.user.findUnique({
    where: { id: user.id },
    select: {
      teams: { select: { name: true, id: true } },
    },
  });

  if (!userWithTeams) return { teams: [] };
  return { teams: userWithTeams.teams };
};

const action: RemixAction = async args => {
  const { request, context } = args;
  const user = await verifyAuth(args);

  const req = await request.text();
  const body = new URLSearchParams(req);

  const name = body.get('channelName') as string;
  const teamId = body.get('teamId') as string;

  if (!name) {
    return redirect('/channels/create');
  }

  const slug = slugify(name, { lower: true });

  const possibleNewTeamName = generateName();

  await context.prisma.featureChannel.create({
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
                id: user.id,
              },
            },
            members: {
              connect: {
                id: user.id,
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
