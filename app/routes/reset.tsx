import { randomBytes } from 'crypto';

import * as React from 'react';
import type { Action } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';
import { Form, usePendingLocation } from '@remix-run/react';
import { addHours } from 'date-fns';

import { makeANiceEmail, client } from '../lib/mail';
import type { RemixContext } from '../context';

const meta = () => ({ title: 'Request a password reset | Toggle' });

const RequestPasswordReset: React.VFC = () => {
  const pendingForm = usePendingLocation();

  return (
    <>
      <h1 className="mb-4 text-3xl font-medium text-center">
        Request a password reset
      </h1>
      <Form
        autoComplete="off"
        method="POST"
        action="/reset"
        className="w-10/12 mx-auto mt-8 max-w-7xl"
      >
        <fieldset disabled={!!pendingForm} className="grid gap-6">
          <label className="block">
            <span>Email: </span>
            <input
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              type="email"
              name="email"
            />
          </label>
          <button
            className="block w-full py-2 mt-1 leading-relaxed border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="submit"
          >
            Request Reset
          </button>
        </fieldset>
      </Form>
    </>
  );
};

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
      'flash',
      'check your email to finish resetting your password'
    );
    return redirect('/reset');
  } catch (error) {
    console.error(error);

    return redirect('/reset');
  }
};

export default RequestPasswordReset;
export { meta, action };
