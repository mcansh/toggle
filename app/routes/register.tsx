import * as React from 'react';
import { Form, Link, usePendingFormSubmit } from '@remix-run/react';
import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';

import type { RemixContext } from '../context';
import { hash } from '../lib/auth';
import { flashTypes } from '../lib/flash';
import { Fieldset } from '../components/form/fieldset';
import { Input } from '../components/form/input';
import { SubmitButton } from '../components/form/button';

const loader: Loader = ({ session }) => {
  if (session.get('userId')) {
    return redirect('/');
  }

  return {};
};

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);

  const name = body.get('name') as string;
  const email = body.get('email') as string;
  const username = body.get('username') as string;
  const password = body.get('password') as string;

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

    return redirect('/');
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      session.flash(flashTypes.error, `Something went wrong`);
      session.flash(
        flashTypes.errorDetails,
        JSON.stringify({ name: error.name, message: error.message }, null, 2)
      );
    }
    return redirect('/register');
  }
};

function meta() {
  return {
    title: 'Register | Toggle',
    description: 'Welcome to Toggle',
  };
}

function Register() {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Welcome to Feature Flags!
        </h1>

        <Form method="post" action="/register">
          <Fieldset disabled={!!pendingForm}>
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
            <SubmitButton type="submit">Register</SubmitButton>
          </Fieldset>
        </Form>

        <div className="mt-4">
          <h2>
            Already have an account yet? Awesome, you can{' '}
            <Link
              className="text-blue-500 transition duration-150 hover:text-blue-800 focus:text-blue-800 ease"
              to="/login"
            >
              log in
            </Link>{' '}
            here
          </h2>
        </div>
      </div>
    </div>
  );
}

export default Register;
export { loader, action, Register, meta };
