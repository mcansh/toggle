import * as React from 'react';
import { Form, Link, usePendingFormSubmit, redirect } from 'remix';
import type { ActionFunction, LoaderFunction } from 'remix';
import { FlagIcon } from '@heroicons/react/outline';

import { flashTypes } from '../lib/flash';
import { withSession } from '../lib/with-session';
import { verify } from '../lib/auth';
import { prisma } from '../db';
import { loginSchema } from '../lib/schemas/login';

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    if (session.get('userId')) {
      return redirect('/');
    }

    return {};
  });

const action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    const requestBody = await request.text();

    const body = new URLSearchParams(requestBody);

    const email = body.get('email');
    const password = body.get('password');

    try {
      const valid = await loginSchema.validate({
        email,
        password,
      });

      const user = await prisma.user.findUnique({
        where: { email: valid.email },
      });

      if (!user) {
        session.unset('userId');
        session.flash(flashTypes.error, `Invalid credentials`);
        return redirect('/login');
      }

      const isValidPassword = await verify(valid.password, user.hashedPassword);

      if (!isValidPassword) {
        session.flash(flashTypes.error, `Invalid credentials`);
        return redirect('/login');
      }

      session.set('userId', user.id);

      const returnTo = session.get('returnTo');

      if (returnTo) {
        session.unset('returnTo');
        return redirect(returnTo);
      }

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
      return redirect('/login');
    }
  });

function meta() {
  return {
    title: 'Sign in to Toggle • Toggle',
    description: 'Welcome to remix!',
  };
}

function LoginPage() {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <FlagIcon className="w-auto h-12 mx-auto text-indigo-600" />
        <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900">
          Sign in to Toggle
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10">
          <Form method="post">
            <fieldset className="space-y-6" disabled={!!pendingForm}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link
                    to="/reset"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              </div>
            </fieldset>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
export { meta, loader, action };
