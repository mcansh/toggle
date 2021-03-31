import * as React from 'react';
import { Form, Link, usePendingFormSubmit } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import type { RemixContext } from '../context';
import { flashTypes } from '../lib/flash';
import { Input } from '../components/input';
import { Button } from '../components/button';
import { commitSession, getSession } from '../sessions';
import { verify } from '../lib/auth';

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  if (session.get('userId')) {
    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  return {};
};

// eslint-disable-next-line max-statements
const action: ActionFunction = async ({ request, context }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as RemixContext;
  const requestBody = await request.text();

  const body = new URLSearchParams(requestBody);

  const email = body.get('email') as string;
  const password = body.get('password') as string;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      session.unset('userId');
      session.flash(flashTypes.error, `Invalid credentials`);
      return redirect('/login', {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

    const valid = await verify(password, user.hashedPassword);

    if (!valid) {
      session.flash(flashTypes.error, `Invalid credentials`);
      return redirect('/login', {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

    session.set('userId', user.id);

    const returnTo = session.get('returnTo');

    if (returnTo) {
      session.unset('returnTo');
      return redirect(returnTo, {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

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
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

function meta() {
  return {
    title: 'Sign in to Toggle • Toggle',
    description: 'Welcome to remix!',
  };
}

function LoginPage() {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Sign in to Toggle
        </h1>
        <Form method="post" action="/login">
          <fieldset
            disabled={!!pendingForm}
            className="flex flex-col p-5 my-4 space-y-4 text-sm text-gray-900 bg-gray-100 border border-gray-200 border-solid rounded"
          >
            <Input
              type="email"
              label="Email"
              name="email"
              placeholder="jane@doe.com"
              autoComplete="email"
            />
            <Input
              type="password"
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder={`thequickbrownfoxjumpedoverthelazydog`
                .split('')
                .map(() => '•')
                .join('')}
            />
            <Button type="submit">Login</Button>
          </fieldset>
        </Form>

        <div className="px-3 py-2 text-sm border border-gray-300 rounded-md">
          <p>
            New to Toggle?{' '}
            <Link className="text-blue-600 hover:underline" to="/join">
              Create an account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
export { meta, loader, action };
