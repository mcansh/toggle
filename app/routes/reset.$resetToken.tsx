import * as React from 'react';
import type { Loader, Action } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import { subHours } from 'date-fns';

import type { RemixContext } from '../context';
import { hash } from '../lib/auth';
import { flashTypes } from '../lib/flash';
import { SubmitButton } from '../components/form/button';
import { Input } from '../components/form/input';
import { Fieldset } from '../components/form/fieldset';

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

    return redirect(returnTo ?? '/');
  } catch (error) {
    console.error(error);
    session.flash(flashTypes.error, `Something went wrong`);
    session.flash(
      flashTypes.errorDetails,
      JSON.stringify({ name: error.name, message: error.message }, null, 2)
    );
    return redirect(pathname);
  }
};

function meta() {
  return {
    title: 'Reset Password | Toggle',
  };
}

const ChangePasswordPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  const { resetToken } = useRouteData<{ resetToken: string }>();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Request Your Password
        </h1>
        <Form method="POST" action={`/reset/${resetToken}`}>
          <Fieldset disabled={!!pendingForm}>
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
            <SubmitButton type="submit">Change Password</SubmitButton>
          </Fieldset>
        </Form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
export { loader, action, meta };
