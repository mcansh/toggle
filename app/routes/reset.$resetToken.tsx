import * as React from 'react';
import { redirect, Form, usePendingFormSubmit, useRouteData } from 'remix';
import { subHours } from 'date-fns';
import { json } from 'remix-utils';

import { flashTypes } from '../lib/flash';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { withSession } from '../lib/with-session';
import { hash } from '../lib/auth';
import { prisma } from '../db';

import type { LoaderFunction, ActionFunction } from 'remix';

interface RouteData {
  resetToken: string;
}

const loader: LoaderFunction = ({ params }) =>
  json<RouteData>({ resetToken: params.resetToken });

const action: ActionFunction = ({ request, params }) =>
  withSession(request, async session => {
    const { resetToken } = params;
    const returnTo = session.get('returnTo') as string | null;

    const { pathname } = new URL(request.url);

    try {
      const requestBody = await request.text();
      const body = new URLSearchParams(requestBody);

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
        session.flash(
          flashTypes.error,
          'This token is either invalid or expired!'
        );
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

      if (returnTo) {
        session.unset('returnTo');
      }

      return redirect(returnTo ?? '/');
    } catch (error: unknown) {
      console.error(error);
      session.flash(flashTypes.error, `Something went wrong`);
      session.flash(flashTypes.errorDetails, {
        name: error.name,
        message: error.message,
      });
      return redirect(pathname);
    }
  });

function meta() {
  return {
    title: 'Reset Password • Toggle',
  };
}

const ChangePasswordPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  const { resetToken } = useRouteData<RouteData>();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Request Your Password
        </h1>
        <Form method="post" action={`/reset/${resetToken}`}>
          <fieldset
            disabled={!!pendingForm}
            className="flex flex-col p-5 my-4 space-y-4 text-sm text-gray-900 bg-gray-100 border border-gray-200 border-solid rounded"
          >
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              name="password"
            />
            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              name="confirmPassword"
            />
            <Button type="submit">Change Password</Button>
          </fieldset>
        </Form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
export { loader, action, meta };
