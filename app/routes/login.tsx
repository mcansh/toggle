import { randomBytes } from 'crypto';

import * as React from 'react';
import { Form, Link, usePendingFormSubmit } from '@remix-run/react';
import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { verify } from 'argon2';
import { addHours } from 'date-fns';

import type { RemixContext } from '../context';
import { makeANiceEmail, client } from '../lib/mail';

function meta() {
  return {
    title: 'Login | Toggle',
    description: 'Welcome to remix!',
  };
}

function Login() {
  const pendingForm = usePendingFormSubmit();

  return (
    <>
      <h1 className="mb-4 text-3xl font-medium text-center">
        Welcome Back to Feature Flags!
      </h1>
      <Form autoComplete="off" method="post" action="/login">
        <fieldset disabled={!!pendingForm} className="grid gap-6">
          <label className="block">
            <span>Email: </span>
            <input
              placeholder="jane@doe.com"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              type="email"
              name="email"
            />
          </label>
          <label className="block">
            <span>Password: </span>
            <input
              placeholder="jane@doe.com"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              type="password"
              name="password"
            />
          </label>
          <button
            className="block w-full py-2 mt-1 leading-relaxed border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="submit"
          >
            Login
          </button>
        </fieldset>
      </Form>

      <div className="mt-4">
        <h2>
          Don&apos;t have an account yet? No sweat, you can{' '}
          <Link
            className="text-blue-500 transition duration-150 hover:text-blue-800 focus:text-blue-800 ease"
            to="/register"
          >
            sign up
          </Link>{' '}
          here, or you can reset your password{' '}
          <Link
            className="text-blue-500 transition duration-150 hover:text-blue-800 focus:text-blue-800 ease"
            to="/reset"
          >
            here
          </Link>{' '}
          if you forgot it.
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

  const email = body.get('email') as string;
  const password = body.get('password') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      session.flash('flash', 'Invalid credentials');
      return redirect('/login');
    }

    if (user.hashedPassword === '""') {
      const resetTokenBuffer = randomBytes(20);
      const resetToken = resetTokenBuffer.toString('hex');
      const resetTokenExpiry = addHours(Date.now(), 1);
      await prisma.user.update({
        where: { email },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      await client.sendEmail({
        From: 'Toggle Team <toggle@mcan.sh>',
        To: `${user.name} <${user.email}>`,
        Subject: 'Your Password Reset Token',
        HtmlBody: makeANiceEmail(`Your Password Reset Token is here!
          \n\n
          <a href="https://toggle.mcan.sh/reset/${resetToken}">Click Here to Reset</a>`),
      });

      session.flash(
        'flash',
        'check your email to finish resetting your password'
      );
      return redirect('/login');
    }

    const verified = await verify(user.hashedPassword, password);

    if (!verified) {
      session.flash('flash', 'Invalid credentials');
      return redirect('/login');
    }

    session.set('userId', user.id);

    const returnTo = session.get('returnTo');

    if (returnTo) {
      return redirect(returnTo);
    }

    return redirect('/');
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      session.flash('flash', `Something went wrong`);
      session.flash(
        'errorDetails',
        JSON.stringify({
          message: error.message,
          name: error.name,
        })
      );
    }
    return redirect('/login');
  }
};

export default Login;
export { meta, loader, action };
