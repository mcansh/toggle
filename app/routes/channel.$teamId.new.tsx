import * as React from 'react';
import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import slugify from 'slugify';

import type { RemixContext } from '../context';
import { flashTypes } from '../lib/flash';

function meta() {
  return {
    title: `Create new Feature Channel | Toggle`,
  };
}

const FeatureChannelPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  const data = useRouteData<{ teamId: string }>();

  return (
    <>
      <h1 className="py-2 text-2xl font-medium">
        Create a new Feature Channel
      </h1>

      <Form
        autoComplete="off"
        method="post"
        action={`/channel/${data.teamId}/new`}
      >
        <fieldset disabled={!!pendingForm} className="grid gap-6">
          <label className="block">
            <span>Name: </span>
            <input
              placeholder="My new channel"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              type="text"
              name="name"
            />
          </label>
          <button
            className="block w-full py-2 mt-1 leading-relaxed border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="submit"
          >
            Create{' '}
            <span role="img" aria-label="check mark">
              ✅
            </span>
          </button>
        </fieldset>
      </Form>
    </>
  );
};

const loader: Loader = async ({ session, request, context, params }) => {
  const userId = session.get('userId');

  const { pathname } = new URL(request.url);

  if (!userId) {
    session.set('returnTo', pathname);
    return redirect('/login');
  }

  const { prisma } = context as RemixContext;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      teams: { select: { id: true } },
    },
  });

  if (!user) {
    session.set('returnTo', pathname);
    return redirect('/login');
  }

  const teamIds = user.teams.map(t => t.id);

  const userBelongsToTeam = teamIds.includes(params.teamId);

  if (!userBelongsToTeam) {
    session.set('returnTo', pathname);
    session.flash(flashTypes.error, `You do not belong to that team`);
    return redirect('/login');
  }

  return { teamId: params.teamId };
};

const action: Action = async ({ session, request, context, params }) => {
  const userId = session.get('userId');

  const { pathname } = new URL(request.url);

  if (!userId) {
    session.set('returnTo', pathname);
  }

  const { prisma } = context as RemixContext;

  try {
    const body = await parseFormBody(request);
    const channelName = body.get('name') as string;

    const channel = await prisma.featureChannel.create({
      data: {
        name: channelName,
        slug: slugify(channelName, { lower: true }),
        team: { connect: { id: params.teamId } },
      },
    });

    return redirect(`/channel/${params.teamId}/${channel.slug}`);
  } catch (error) {
    console.error(error);
    session.flash(flashTypes.error, `Something went wrong`);
    session.flash(
      flashTypes.errorDetails,
      JSON.stringify({ name: error.name, message: error.message }, null, 2)
    );
    return redirect(pathname);
  }
};

export default FeatureChannelPage;
export { meta, action, loader };
