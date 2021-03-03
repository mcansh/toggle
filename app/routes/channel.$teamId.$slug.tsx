import * as React from 'react';
import type { FeatureChannel, Flag, FlagType, Team } from '@prisma/client';
import type { Action } from '@remix-run/data';
import { redirect } from '@remix-run/data';
import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import type { Except } from 'type-fest';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';
import { pascalCase } from 'change-case';
import { useTable } from 'react-table';
import { ago } from 'time-ago';

import type { RemixContext, RemixLoader } from '../context';
import { flashTypes } from '../lib/flash';
import { commitSession, getSession } from '../sessions';
import { Button } from '../components/button';
import { BaseInput, Input, InputLabel } from '../components/input';

type StringDateFlag = Except<Flag, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

interface RouteData {
  channel:
    | (FeatureChannel & {
        flags: Array<StringDateFlag>;
        team: {
          slug: Pick<Team, 'name'>;
        };
      })
    | undefined;
  channelColumns: Array<{ Header: string; accessor: string }>;
  channelData: Array<any>;
}

type Params = { teamId: string; slug: string };

const loader: RemixLoader<RouteData, Params> = async ({
  request,
  context,
  params,
}) => {
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as RemixContext;

  const { pathname } = new URL(request.url);

  const userId = session.get('userId');

  if (!userId) {
    session.set('returnTo', pathname);
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
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
        },
      },
    },
  });

  if (!channel) {
    return new Response(JSON.stringify({ channel: undefined }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  const channelColumns = [
    {
      Header: 'Feature',
      accessor: 'feature',
    },
    {
      Header: 'Type',
      accessor: 'type',
    },
    {
      Header: 'Updated',
      accessor: 'updated',
    },
    {
      Header: 'Value',
      accessor: 'value',
    },
  ];

  const channelData = channel.flags.map(flag => {
    const updated = ago(flag.updatedAt);
    return {
      feature: flag.feature,
      type: flag.type,
      updated,
      value: flag.value,
    };
  });

  return new Response(
    JSON.stringify({ channel, channelColumns, channelData }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': await commitSession(session),
      },
    }
  );
};

const action: Action = async ({ context, params, request }) => {
  // verify session
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  const { pathname } = new URL(request.url);

  if (!userId) {
    session.set('returnTo', pathname);
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  const { prisma } = context as RemixContext;
  const requestBody = await request.text();
  const body = new URLSearchParams(requestBody);
  const method: string = (body.get('_method') ?? request.method).toLowerCase();

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
        session.flash(flashTypes.error, 'Something went wrong');
        return redirect(pathname, {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        });
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
          feature: pascalCase(featureName),
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

      return redirect(pathname, {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }
  } catch (error) {
    session.flash(flashTypes.error, 'Something went wrong');
    session.flash(
      flashTypes.errorDetails,
      JSON.stringify({ name: error.name, message: error.message }, null, 2)
    );
    return redirect(pathname, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  session.flash(flashTypes.error, `invalid request method "${method}"`);
  return redirect(pathname, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
};

function meta({ data }: { data: RouteData }) {
  if (!data.channel) {
    return {
      title: 'Toggle',
    };
  }

  return {
    title: `${data.channel.team.slug}/${data.channel.slug}`,
  };
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
  const data = useRouteData<RouteData>();
  const pendingForm = usePendingFormSubmit();
  const [form, setForm] = React.useState<FormState>({
    name: '',
    type: 'string',
    value: '',
  });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns: data.channelColumns, data: data.channelData });

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
        <table
          {...getTableProps()}
          className="min-w-full divide-y divide-gray-200"
        >
          <thead className="bg-gray-50">
            {headerGroups.map(headerGroup => {
              const headerGroupProps = headerGroup.getHeaderGroupProps();
              return (
                <tr {...headerGroupProps} key={headerGroupProps.key}>
                  {headerGroup.headers.map(column => {
                    const columnProps = column.getHeaderProps();
                    return (
                      <th
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                        {...columnProps}
                        key={columnProps.key}
                      >
                        {column.render('Header')}
                      </th>
                    );
                  })}
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              );
            })}
          </thead>

          <tbody
            {...getTableBodyProps()}
            className="bg-white divide-y divide-gray-200"
          >
            {rows.map(row => {
              prepareRow(row);
              const rowProps = row.getRowProps();
              return (
                <tr {...rowProps} key={rowProps.key} className="">
                  {row.cells.map(cell => {
                    const cellProps = cell.getCellProps();
                    return (
                      <td
                        {...cellProps}
                        key={cellProps.key}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        // eslint-disable-next-line no-alert
                        alert('flag deletion is temporarily disabled')
                      }
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Delete
                    </button>
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
        method="post"
        action={`/channel/${data.channel.teamId}/${data.channel.slug}`}
        className="pt-6"
      >
        <fieldset
          disabled={!!pendingForm}
          className="flex flex-col p-5 my-4 space-y-4 text-sm text-gray-900 bg-gray-100 border border-gray-200 border-solid rounded"
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
