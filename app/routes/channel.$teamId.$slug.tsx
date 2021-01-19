import * as React from 'react';
import type { FeatureChannel, Flag, FlagType } from '@prisma/client';
import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import type { Except } from 'type-fest';
import { format, isToday, parseISO } from 'date-fns';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';
import { pascalCase } from 'change-case';

import type { RemixContext } from '../context';
import { flashTypes } from '../lib/flash';
import { Fieldset } from '../components/form/fieldset';
import { Input, InputOnly, Label } from '../components/form/input';
import { SubmitButton } from '../components/form/button';

const loader: Loader = async ({ request, context, session, params }) => {
  const { prisma } = context as RemixContext;

  const { pathname } = new URL(request.url);

  const userId = session.get('userId');

  if (!userId) {
    session.set('returnTo', pathname);
    return redirect('/login');
  }

  const teamChannels = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: { featureChannels: true },
  });

  const matchingChannel = teamChannels?.featureChannels.find(
    c => c.slug === params.slug
  );

  if (matchingChannel) {
    const channel = await prisma.featureChannel.findUnique({
      where: { id: matchingChannel.id },
      include: { flags: { orderBy: { updatedAt: 'desc' } } },
    });

    return { channel };
  }

  return new Response(JSON.stringify({ channel: undefined }), {
    status: 404,
    headers: {
      'content-type': 'application/json',
    },
  });
};

const action: Action = async ({ context, params, request, session }) => {
  // verify session
  const userId = session.get('userId');

  const { pathname } = new URL(request.url);

  if (!userId) {
    session.set('returnTo', pathname);
    return redirect('/login');
  }

  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);
  const method: string = (body.get('_method') ?? request.method).toUpperCase();

  try {
    if (method === 'DELETE') {
      const featureId = body.get('featureId') as string;
      await prisma.flag.delete({ where: { id: featureId } });
      return redirect(pathname);
    }

    if (method === 'POST') {
      const channel = await prisma.featureChannel.findFirst({
        where: {
          teamId: params.teamId,
          slug: params.slug,
        },
      });

      if (!channel) {
        session.flash(flashTypes.error, 'Something went wrong');
        return redirect(pathname);
      }

      const featureName = body.get('name') as string;
      const featureType = body.get('type') as FlagType;
      const featureValue = body.get('value') as string;

      await prisma.flag.create({
        data: {
          createdBy: {
            connect: { id: userId },
          },
          lastUpdatedBy: {
            connect: { id: userId },
          },
          feature: featureName.includes(' ')
            ? pascalCase(featureName)
            : featureName,
          type: featureType,
          value: featureValue,
          team: {
            connect: { id: params.teamId },
          },
          featureChannel: {
            connect: { id: channel.id },
          },
        },
      });

      return redirect(pathname);
    }
  } catch (error) {
    session.flash(flashTypes.error, 'Something went wrong');
    session.flash(
      flashTypes.errorDetails,
      JSON.stringify({ name: error.name, message: error.message }, null, 2)
    );
    return redirect(pathname);
  }

  session.flash(flashTypes.error, `invalid request method "${method}"`);
  return redirect(pathname);
};

function meta({ data }: { data: Data }) {
  if (!data.channel) {
    return {
      title: 'Toggle',
    };
  }

  return {
    title: `${data.channel.name} | Toggle`,
  };
}

type StringDateFlag = Except<Flag, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

interface Data {
  channel: (FeatureChannel & { flags: Array<StringDateFlag> }) | undefined;
}

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
  const data = useRouteData<Data>();
  const pendingForm = usePendingFormSubmit();
  const [form, setForm] = React.useState<FormState>({
    name: '',
    type: 'string',
    value: '',
  });

  if (!data.channel) {
    return <h1>Channel not found</h1>;
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
        <table className="w-full border rounded-md table-auto">
          <thead>
            <tr className="text-left border-b divide-x">
              <th>Feature</th>
              <th>Type</th>
              <th>Value</th>
              <th>Updated At</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.channel.flags.map(flag => {
              const flagUpdatedDate = parseISO(flag.updatedAt);
              const createdToday = isToday(flagUpdatedDate);
              return (
                <tr key={flag.id} className="divide-x">
                  <td>{flag.feature}</td>
                  <td>{flag.type}</td>
                  <td>{flag.value}</td>
                  <td>
                    <time dateTime={flag.updatedAt}>
                      {format(flagUpdatedDate, createdToday ? 'p' : 'P')}
                    </time>
                  </td>
                  <td>
                    <Form
                      className="text-center"
                      action={`/channel/${data.channel?.teamId}/${data.channel?.slug}`}
                      method="delete"
                    >
                      <input type="hidden" name="_method" value="DELETE" />
                      <input type="hidden" name="featureId" value={flag.id} />
                      <button type="submit">&times;</button>
                    </Form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Your team hasn&apos;t created any flags yet</p>
      )}

      <Form
        autoComplete="off"
        method="POST"
        action={`/channel/${data.channel.teamId}/${data.channel.slug}`}
        className="pt-6"
      >
        <Fieldset disabled={!!pendingForm}>
          <Input
            name="name"
            label="Name"
            type="text"
            placeholder="MyNewFeature"
            value={form.name}
            onChange={handleFormChange}
          />
          <Label label="Type">
            <select
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              name="type"
              value={form.type}
              onChange={handleFormChange}
            >
              <option value="string">String</option>
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
          </Label>
          <Label label="Value">
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
                <InputOnly
                  type="text"
                  hidden
                  name="value"
                  readOnly
                  value={String(form.value)}
                />
              </>
            ) : form.type === 'number' ? (
              <InputOnly
                placeholder="25"
                type="text"
                name="value"
                value={form.value}
                onChange={handleFormChange}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ) : (
              <InputOnly
                placeholder="http://someapi.ff.io"
                type="text"
                name="value"
                value={form.value}
                onChange={handleFormChange}
              />
            )}
          </Label>
          <SubmitButton type="submit">
            Creat{pendingForm?.method === 'post' ? 'ing' : 'e'} Feature Toggle
          </SubmitButton>
        </Fieldset>
      </Form>
    </>
  );
};

export default FeatureChannelPage;
export { loader, action, meta };
