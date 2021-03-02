import * as React from 'react';
import { Form, usePendingFormSubmit } from '@remix-run/react';
import type { Action, Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import type { RemixContext } from '../context';
import { hash } from '../lib/auth';
import { flashTypes } from '../lib/flash';
import { Input } from '../components/input';
import { Button } from '../components/button';
import { commitSession, getSession } from '../sessions';

const loader: Loader = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  if (session.get('userId')) {
    return redirect('/');
  }

  return {};
};

const action: Action = async ({ request, context }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as RemixContext;
  const requestBody = await request.text();
  const body = new URLSearchParams(requestBody);

  const name = body.get('name');
  const email = body.get('email');
  const username = body.get('username');
  const password = body.get('password');

  if (!name || !email || !username || !password) {
    session.flash(
      flashTypes.error,
      JSON.stringify({ message: 'missing required field' })
    );
    return redirect('/join', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  try {
    const hashedPassword = await hash(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
        hashedPassword,
        teams: {
          create: {
            name: `${username}'s team`,
            featureChannels: {
              create: {
                name: 'My first feature channel!',
                slug: 'my-first-feature-channel',
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    session.set('userId', user.id);

    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      session.flash(flashTypes.error, `Something went wrong`);
      session.flash(
        flashTypes.errorDetails,
        JSON.stringify({ name: error.name, message: error.message }, null, 2)
      );
    }
    return redirect('/join', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

function meta() {
  return {
    title: 'Join Toggle | Toggle',
    description: 'Welcome to Toggle',
  };
}

function JoinPage() {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Welcome to Feature Flags!
        </h1>

        <Form method="post" action="/join">
          <fieldset
            disabled={!!pendingForm}
            className="flex flex-col p-5 my-4 space-y-4 text-sm text-gray-900 bg-gray-100 border border-gray-200 border-solid rounded"
          >
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              placeholder="name"
              name="name"
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="email"
              name="email"
            />
            <Input
              label="Username"
              type="text"
              autoComplete="username"
              placeholder="username"
              name="username"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="password"
              name="password"
            />
            <Button type="submit">Register</Button>
          </fieldset>
        </Form>
      </div>
    </div>
  );
}

export default JoinPage;
export { loader, action, JoinPage, meta };