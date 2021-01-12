import * as React from 'react';
import { Form, Link, usePendingFormSubmit } from '@remix-run/react';
import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { hash } from 'argon2';

import type { RemixContext } from '../context';

function meta() {
  return {
    title: 'Register | Toggle',
    description: 'Welcome to Toggle',
  };
}

function Register() {
  const pendingForm = usePendingFormSubmit();

  return (
    <>
      <h1 className="mb-4 text-3xl font-medium text-center">
        Welcome to Feature Flags!
      </h1>

      <Form method="post" action="/register">
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <input
            type="text"
            autoComplete="name"
            placeholder="name"
            name="name"
            className="w-full border-2 rounded"
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="email"
            name="email"
            className="w-full border-2 rounded"
          />
          <input
            type="text"
            autoComplete="username"
            placeholder="username"
            name="username"
            className="w-full border-2 rounded"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="password"
            name="password"
            className="w-full border-2 rounded"
          />
          <button
            type="submit"
            className="py-1 font-medium leading-loose text-white uppercase transition duration-150 bg-pink-500 rounded-full shadow-lg hover:bg-pink-800 focus:bg-pink-800"
          >
            Register
          </button>
        </fieldset>
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
    </>
  );
}

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
      session.flash('flash', `Something went wrong`);
      session.flash(
        'errorDetails',
        JSON.stringify({
          name: error.name,
          message: error.message,
        })
      );
    }
    return redirect('/register');
  }
};

export default Register;
export { loader, action, Register, meta };
