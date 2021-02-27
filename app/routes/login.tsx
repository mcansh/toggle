import { randomBytes } from 'crypto';

import * as React from 'react';
import { Form, Link, usePendingFormSubmit } from '@remix-run/react';
import type { Action, Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';
import { addHours } from 'date-fns';

import type { RemixContext } from '../context';
import { makeANiceEmail, client } from '../lib/mail';
import { hash, verify } from '../lib/auth';
import { flashTypes } from '../lib/flash';
import { Input } from '../components/form/input';
import { SubmitButton } from '../components/form/button';
import { Fieldset } from '../components/form/fieldset';
import { commitSession, getSession } from '../sessions';

const loader: Loader = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  if (session.get('userId')) {
    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  return {};
};

// eslint-disable-next-line max-statements
const action: Action = async ({ request, context }) => {
  const SecurePassword = await import('secure-password');
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as RemixContext;
  const requestBody = await request.text();

  const body = new URLSearchParams(requestBody);

  const email = body.get('email') as string;
  const password = body.get('password') as string;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      session.unset('userId');
      session.flash(flashTypes.error, `Invalid credentials`);
      return redirect('/login', {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
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
          <a href="${process.env.FRONTEND_URL}/reset/${resetToken}">Click Here to Reset</a>`),
      });

      session.flash(
        flashTypes.success,
        `check your email to finish resetting your password`
      );
      return redirect('/login', {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

    const result = await verify(user.hashedPassword, password);

    switch (result) {
      case SecurePassword.VALID: {
        session.set('userId', user.id);

        const returnTo = session.get('returnTo');

        if (returnTo) {
          session.unset('returnTo');
          return redirect(returnTo, {
            headers: {
              'Set-Cookie': await commitSession(session),
            },
          });
        }

        return redirect('/', {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        });
      }

      case SecurePassword.VALID_NEEDS_REHASH: {
        const improvedHash = await hash(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { hashedPassword: improvedHash },
        });

        session.set('userId', user.id);

        const returnTo = session.get('returnTo');

        if (returnTo) {
          return redirect(returnTo, {
            headers: {
              'Set-Cookie': await commitSession(session),
            },
          });
        }

        return redirect('/', {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        });
      }

      default: {
        session.flash(flashTypes.error, `Invalid credentials`);
        return redirect('/login', {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        });
      }
    }
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      session.flash(flashTypes.error, `Something went wrong`);
      session.flash(
        flashTypes.errorDetails,
        JSON.stringify({ name: error.name, message: error.message }, null, 2)
      );
    }
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

function meta() {
  return {
    title: 'Login | Toggle',
    description: 'Welcome to remix!',
  };
}

function LoginPage() {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full">
        <h1 className="mb-4 text-3xl font-medium text-center">
          Welcome Back to Feature Flags!
        </h1>
        <Form method="post" action="/login">
          <Fieldset disabled={!!pendingForm}>
            <Input
              type="email"
              label="Email"
              name="email"
              placeholder="jane@doe.com"
              autoComplete="email"
            />
            <Input
              type="password"
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder={`thequickbrownfoxjumpedoverthelazydog`
                .split('')
                .map(() => '•')
                .join('')}
            />
            <SubmitButton type="submit">Login</SubmitButton>
          </Fieldset>
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
      </div>
    </div>
  );
}

export default LoginPage;
export { meta, loader, action };
