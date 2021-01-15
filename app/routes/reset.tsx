import { randomBytes } from 'crypto';

import * as React from 'react';
import type { Action } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { Form, usePendingLocation } from '@remix-run/react';
import { addHours } from 'date-fns';

import { makeANiceEmail, client } from '../lib/mail';
import type { RemixContext } from '../context';
import { flashTypes } from '../lib/flash';
import { Input } from '../components/form/input';
import { SubmitButton } from '../components/form/button';
import { Fieldset } from '../components/form/fieldset';

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);
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
    return redirect('/reset');
  } catch (error) {
    console.error(error);

    return redirect('/reset');
  }
};

const meta = () => ({ title: 'Request a password reset | Toggle' });

const RequestPasswordResetPage: React.VFC = () => {
  const pendingForm = usePendingLocation();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Request a password reset
        </h1>
        <Form method="POST" action="/reset">
          <Fieldset disabled={!!pendingForm}>
            <Input
              autoComplete="email"
              label="Email"
              type="email"
              name="email"
              placeholder="jane@doe.com"
            />
            <SubmitButton type="submit">Request Reset</SubmitButton>
          </Fieldset>
        </Form>
      </div>
    </div>
  );
};

export default RequestPasswordResetPage;
export { meta, action };
