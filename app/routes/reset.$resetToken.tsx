import * as React from 'react';
import type { Loader, Action } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import { subHours } from 'date-fns';

import type { RemixContext } from '../context';
import { hash } from '../lib/auth';

function meta() {
  return {
    title: 'Reset Password | Toggle',
  };
}

const ChangePasswordPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  const { resetToken } = useRouteData<{ resetToken: string }>();

  return (
    <Form method="POST" action={`/reset/${resetToken}`}>
      <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
        <input
          type="password"
          autoComplete="new-password"
          placeholder="password"
          name="password"
          className="w-full border-2 rounded"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="confirm password"
          name="confirmPassword"
          className="w-full border-2 rounded"
        />
        <button
          type="submit"
          className="py-1 font-medium leading-loose text-white uppercase transition duration-150 bg-pink-500 rounded-full shadow-lg hover:bg-pink-800 focus:bg-pink-800"
        >
          Change Password
        </button>
      </fieldset>
    </Form>
  );
};

const loader: Loader = ({ params }) => ({ resetToken: params.resetToken });

const action: Action = async ({ session, request, context, params }) => {
  const { prisma } = context as RemixContext;
  const { resetToken } = params;
  const returnTo = session.get('returnTo') as string;

  const { pathname } = new URL(request.url);

  try {
    const body = await parseFormBody(request);

    // 1. find user with that reset token and make sure it's still valid
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpiry: {
          gte: subHours(Date.now(), 1),
        },
      },
    });

    // 2. check we got a user back
    if (!user) {
      session.flash('flash', 'This token is either invalid or expired!');
      return redirect('/login');
    }

    const password = body.get('password') as string;
    const confirmPassword = body.get('confirmPassword') as string;

    // 3. verify new password matches
    if (password !== confirmPassword) {
      session.set('flash', 'password do not match');
      return redirect(pathname);
    }

    // 4. hash their new password
    const hashedPassword = await hash(password);

    // 5. update the user's password and remove resetToken fields
    await prisma.user.update({
      data: { hashedPassword, resetToken: null, resetTokenExpiry: null },
      where: { id: user.id },
    });

    session.set('userId', user.id);

    return redirect(returnTo ?? '/');
  } catch (error) {
    console.error(error);
    session.flash(`flash`, `Something went wrong`);
    session.flash(
      `errorDetails`,
      JSON.stringify({ name: error.name, message: error.message })
    );
    return redirect(pathname);
  }
};

export default ChangePasswordPage;
export { loader, action, meta };
