import { randomBytes } from 'crypto';

import * as React from 'react';
import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Form, usePendingLocation } from '@remix-run/react';
import { addHours } from 'date-fns';

import { makeANiceEmail, client } from '../lib/mail';
import type { RemixContext } from '../context';
import { flashTypes } from '../lib/flash';
import { Input } from '../components/input';
import { Button } from '../components/button';
import { commitSession, getSession } from '../sessions';

const action: ActionFunction = async ({ request, context }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as RemixContext;
  const requestBody = await request.text();
  const body = new URLSearchParams(requestBody);

  const email = body.get('email') as string;

  const resetTokenBuffer = randomBytes(20);
  const resetToken = resetTokenBuffer.toString('hex');
  const resetTokenExpiry = addHours(Date.now(), 1);

  const user = await prisma.user.update({
    where: { email },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  try {
    await client.sendEmail({
      From: 'Toggle Team <toggle@mcan.sh>',
      To: `${user.name} <${user.email}>`,
      Subject: 'Your Password Reset Token',
      HtmlBody: makeANiceEmail(`Your Password Reset Token is here!
        \n\n
        <a href="${process.env.FRONTEND_URL}/reset/${resetToken}">Click Here to Reset</a>`),
    });

    session.flash(
      flashTypes.info,
      'check your email to finish resetting your password'
    );
    return redirect('/reset', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);

    return redirect('/reset');
  }
};

const meta = () => ({ title: 'Forgot your password? • Toggle' });

const RequestPasswordResetPage: React.VFC = () => {
  const pendingForm = usePendingLocation();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Request a password reset
        </h1>
        <Form method="post" action="/reset">
          <fieldset
            disabled={!!pendingForm}
            className="flex flex-col p-5 my-4 space-y-4 text-sm text-gray-900 bg-gray-100 border border-gray-200 border-solid rounded"
          >
            <Input
              autoComplete="email"
              label="Email"
              type="email"
              name="email"
              placeholder="jane@doe.com"
            />
            <Button type="submit">Request Reset</Button>
          </fieldset>
        </Form>
      </div>
    </div>
  );
};

export default RequestPasswordResetPage;
export { meta, action };
