import * as React from 'react';
import type { FlagType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix';
import { redirect, Form, usePendingFormSubmit, useRouteData } from 'remix';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';
import { pascalCase } from 'change-case';
import { ago } from 'time-ago';
import { json } from 'remix-utils';

import { flashTypes } from '../lib/flash';
import { withSession } from '../lib/with-session';
import { Button } from '../components/button';
import { BaseInput, Input, InputLabel } from '../components/input';
import { prisma } from '../db';

import FourOhFour, { meta as fourOhFourMeta } from './404';

const channelWithTeamSlug = Prisma.validator<Prisma.FeatureChannelArgs>()({
  include: {
    team: {
      select: {
        slug: true,
      },
    },
  },
});

type ChannelWithTeamSlug = Prisma.FeatureChannelGetPayload<
  typeof channelWithTeamSlug
>;

const flagSelection = Prisma.validator<Prisma.FlagArgs>()({
  select: {
    type: true,
    feature: true,
    id: true,
    value: true,
  },
});

type Flag = Prisma.FlagGetPayload<typeof flagSelection>;

interface RouteData {
  channel?: ChannelWithTeamSlug & {
    flags: Array<Flag & { updated: string }>;
  };
}

const loader: LoaderFunction = ({ request, params }) =>
  withSession(request, async session => {
    const { pathname } = new URL(request.url);

    const userId = session.get('userId');

    if (!userId) {
      session.set('returnTo', pathname);
      return redirect('/login');
    }

    const channel = await prisma.featureChannel.findFirst({
      where: {
        AND: [{ teamId: params.teamId }, { slug: params.slug }],
      },
      include: {
        team: {
          select: {
            slug: true,
          },
        },
        flags: {
          orderBy: { updatedAt: 'desc' },
          select: {
            updatedAt: true,
            feature: true,
            type: true,
            value: true,
            id: true,
          },
        },
      },
    });

    if (!channel) {
      return json<RouteData>({ channel: undefined }, { status: 404 });
    }

    const channelData = channel.flags.map(flag => {
      const updated = ago(flag.updatedAt);
      return {
        feature: flag.feature,
        type: flag.type,
        updated,
        value: flag.value,
        id: flag.id,
      };
    });

    return json<RouteData>({ channel: { ...channel, flags: channelData } });
  });

const action: ActionFunction = ({ params, request }) =>
  withSession(request, async session => {
    // verify session
    const userId = session.get('userId');

    const { pathname } = new URL(request.url);

    if (!userId) {
      session.set('returnTo', pathname);
      return redirect('/login');
    }

    const requestBody = await request.text();
    const body = new URLSearchParams(requestBody);
    const method: string = (
      body.get('_method') ?? request.method
    ).toLowerCase();

    try {
      if (method === 'delete') {
        const featureId = body.get('featureId') as string;
        await prisma.flag.delete({ where: { id: featureId } });
        return redirect(pathname);
      }

      if (method === 'post') {
        const channel = await prisma.featureChannel.findFirst({
          where: {
            teamId: params.teamId,
            slug: params.slug,
          },
        });
        if (!channel) {
          session.flash(flashTypes.error, "That channel doesn't exist");
          return redirect('/');
        }
        const featureName = body.get('name') as string;
        const featureType = body.get('type') as FlagType;
        const featureValue = body.get('value') as string;

        if (!featureName || !featureType || !featureValue) {
          session.flash(flashTypes.error, 'Missing required feature field');
          return redirect(pathname);
        }

        await prisma.flag.create({
          data: {
            feature: pascalCase(featureName),
            type: featureType,
            value:
              featureType === 'boolean'
                ? !featureValue
                  ? 'false'
                  : 'true'
                : featureValue,
            createdBy: {
              connect: { id: userId },
            },
            lastUpdatedBy: {
              connect: { id: userId },
            },
            featureChannel: {
              connect: { id: channel.id },
            },
          },
        });

        return redirect(pathname);
      }

      session.flash(flashTypes.error, `invalid request method "${method}"`);
      return redirect(pathname);
    } catch (error) {
      console.error(error);

      session.flash(flashTypes.error, 'Something went wrong');
      session.flash(
        flashTypes.errorDetails,
        JSON.stringify({ name: error.name, message: error.message }, null, 2)
      );
      return redirect(pathname);
    }
  });

const meta: MetaFunction = ({ data }: { data: RouteData }) => {
  if (!data.channel) {
    return fourOhFourMeta();
  }

  return {
    title: `${data.channel.team.slug}/${data.channel.slug}`,
  };
};

interface BooleanForm {
  name: string;
  type: 'boolean';
  value: boolean;
}

interface NumberForm {
  name: string;
  type: 'number';
  value: number;
}

interface StringForm {
  name: string;
  type: 'string';
  value: string;
}

type FormState = BooleanForm | NumberForm | StringForm;

const FeatureChannelPage: React.VFC = () => {
  const data = useRouteData<RouteData>();
  const pendingForm = usePendingFormSubmit();
  const [form, setForm] = React.useState<FormState>({
    name: '',
    type: 'string',
    value: '',
  });

  if (!data.channel) {
    return <FourOhFour />;
  }

  function handleFormChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    return setForm(old => ({
      ...old,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <>
      <h1 className="py-2 text-2xl font-medium">
        {data.channel.name} Feature Flags
      </h1>
      {data.channel.flags.length > 0 ? (
        <div className="w-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Feature
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Value
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Updated
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.channel.flags.map(flag => (
                <tr key={flag.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {flag.feature}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
                      {flag.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {flag.value}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {flag.updated}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <Form method="delete">
                      <input
                        type="text"
                        hidden
                        readOnly
                        value={flag.id}
                        name="featureId"
                      />
                      <input
                        type="text"
                        hidden
                        readOnly
                        name="_method"
                        value="delete"
                      />
                      <button
                        type="submit"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Delete
                      </button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Your team hasn&apos;t created any flags yet</p>
      )}

      <Form
        autoComplete="off"
        method="post"
        action={`/channel/${data.channel.teamId}/${data.channel.slug}`}
        className="pt-6"
      >
        <fieldset
          disabled={!!pendingForm}
          className="flex flex-col p-5 my-4 space-y-4 text-sm text-gray-900 bg-gray-100 border border-gray-200 border-solid rounded disabled:opacity-70"
        >
          <Input
            name="name"
            label="Name"
            type="text"
            placeholder="MyNewFeature"
            value={form.name}
            onChange={handleFormChange}
          />
          <InputLabel id="type" label="Type">
            <select
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              name="type"
              value={form.type}
              onChange={handleFormChange}
              id="type"
            >
              <option value="string">String</option>
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
          </InputLabel>
          <InputLabel id="value" label="Value">
            {form.type === 'boolean' ? (
              <>
                <Switch
                  checked={
                    typeof form.value === 'boolean' && form.value === true
                  }
                  onChange={checked =>
                    setForm(old => ({
                      ...old,
                      type: 'boolean',
                      value: checked,
                    }))
                  }
                  className={clsx(
                    'relative items-center inline-flex h-5 rounded-full w-8',
                    form.value === true ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                >
                  <span className="sr-only">Enable feature</span>
                  <span
                    className={clsx(
                      'inline-block w-4 h-4 transition-transform ease-in-out duration-100 transform bg-white rounded-full',
                      form.value === true ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </Switch>
                <BaseInput
                  type="text"
                  hidden
                  name="value"
                  readOnly
                  value={String(form.value)}
                />
              </>
            ) : form.type === 'number' ? (
              <BaseInput
                placeholder="25"
                type="text"
                name="value"
                value={form.value}
                onChange={handleFormChange}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ) : (
              <BaseInput
                placeholder="http://someapi.ff.io"
                type="text"
                name="value"
                value={form.value}
                onChange={handleFormChange}
              />
            )}
          </InputLabel>
          <Button variant="primary" type="submit">
            Creat{pendingForm?.method === 'post' ? 'ing' : 'e'} Feature Toggle
          </Button>
        </fieldset>
      </Form>
    </>
  );
};

export default FeatureChannelPage;
export { loader, action, meta };
