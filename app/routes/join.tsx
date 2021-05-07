import * as React from 'react';
import { Form, usePendingFormSubmit, redirect, useRouteData } from 'remix';
import type { ActionFunction, LoaderFunction } from 'remix';
import slugify from 'slugify';
import { ValidationError } from 'yup';
import { json } from 'remix-utils';
import clsx from 'clsx';

import { withSession } from '../lib/with-session';
import { generateName } from '../lib/name-generator';
import { hash } from '../lib/auth';
import { prisma } from '../db';
import type { JoinSchema } from '../lib/schemas/join';
import { joinSchema } from '../lib/schemas/join';
import { yupToObject } from '../lib/yup-to-object';
import { safeParse } from '../lib/safe-json-parse';

interface RouteData {
  joinError?: Partial<JoinSchema> & {
    generic?: string;
  };
}

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    if (session.get('userId')) {
      return redirect('/');
    }

    const joinError = session.get('joinError');

    const parsed = safeParse<RouteData['joinError']>(joinError);

    return json<RouteData>({ joinError: parsed });
  });

const action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    const requestBody = await request.text();
    const body = new URLSearchParams(requestBody);

    try {
      const valid = await joinSchema.validate(
        {
          givenName: body.get('givenName'),
          familyName: body.get('familyName'),
          email: body.get('email'),
          username: body.get('username'),
          password: body.get('password'),
          confirmPassword: body.get('confirmPassword'),
        },
        { abortEarly: false }
      );

      const foundUser = await prisma.user.findUnique({
        where: { email: valid.email },
      });

      if (foundUser) {
        const aggregateErrors: Partial<JoinSchema> = {};

        if (foundUser.email === valid.email) {
          aggregateErrors.email = 'A user with this email already exists';
        }

        if (foundUser.username === valid.username) {
          aggregateErrors.username = 'A user with this username already exists';
        }

        session.flash('joinError', JSON.stringify(aggregateErrors));
        return redirect('/join');
      }

      const hashedPassword = await hash(valid.password);
      const newTeamName = generateName();

      const user = await prisma.user.create({
        select: { id: true },
        data: {
          email: valid.email,
          givenName: valid.givenName,
          familyName: valid.familyName,
          fullName: `${valid.givenName} ${valid.familyName}`,
          username: valid.username,
          hashedPassword,
          teams: {
            create: {
              name: newTeamName,
              slug: slugify(newTeamName, { lower: true }),
              createdBy: { connect: { email: valid.email } },
            },
          },
        },
      });

      session.set('userId', user.id);

      return redirect('/');
    } catch (error) {
      console.error(error);
      if (error instanceof ValidationError) {
        const aggregateErrors = yupToObject<JoinSchema>(error);

        session.flash('joinError', JSON.stringify(aggregateErrors));
        return redirect('/join');
      }

      session.flash(
        'joinError',
        JSON.stringify({ generic: 'something went wrong' })
      );
      return redirect('/join');
    }
  });

function meta() {
  return {
    title: 'Join Toggle • Toggle',
    description: 'Welcome to Toggle',
  };
}

function JoinPage() {
  const data = useRouteData<RouteData>();
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="w-auto h-12 mx-auto"
          src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
          alt="Workflow"
        />
        <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900">
          Join Toggle
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10">
          <Form method="post">
            <fieldset className="space-y-6" disabled={!!pendingForm}>
              <div>
                <label
                  htmlFor="givenName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Given Name
                </label>
                <div className="mt-1">
                  <input
                    id="givenName"
                    name="givenName"
                    type="text"
                    autoComplete="given-name"
                    className={clsx(
                      'block w-full px-3 py-2 placeholder-gray-400 border shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                      data.joinError?.givenName
                        ? 'rounded-t-md border-red-500'
                        : 'rounded-md border-gray-300'
                    )}
                  />
                  {data.joinError?.givenName && (
                    <p className="px-3 py-2 text-white bg-red-500 shadow-sm rounded-b-md text-opacity-90 sm:text-sm">
                      {data.joinError.givenName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="familyName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Family Name
                </label>
                <div className="mt-1">
                  <input
                    id="familyName"
                    name="familyName"
                    type="text"
                    autoComplete="family-name"
                    className={clsx(
                      'block w-full px-3 py-2 placeholder-gray-400 border shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                      data.joinError?.familyName
                        ? 'rounded-t-md border-red-500'
                        : 'rounded-md border-gray-300'
                    )}
                  />
                  {data.joinError?.familyName && (
                    <p className="px-3 py-2 text-white bg-red-500 shadow-sm rounded-b-md text-opacity-90 sm:text-sm">
                      {data.joinError.familyName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    className={clsx(
                      'block w-full px-3 py-2 placeholder-gray-400 border shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                      data.joinError?.username
                        ? 'rounded-t-md border-red-500'
                        : 'rounded-md border-gray-300'
                    )}
                  />
                  {data.joinError?.username && (
                    <p className="px-3 py-2 text-white bg-red-500 shadow-sm rounded-b-md text-opacity-90 sm:text-sm">
                      {data.joinError.username}
                    </p>
                  )}
                </div>
              </div>

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
                    className={clsx(
                      'block w-full px-3 py-2 placeholder-gray-400 border shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                      data.joinError?.email
                        ? 'rounded-t-md border-red-500'
                        : 'rounded-md border-gray-300'
                    )}
                  />
                  {data.joinError?.email && (
                    <p className="px-3 py-2 text-white bg-red-500 shadow-sm rounded-b-md text-opacity-90 sm:text-sm">
                      {data.joinError.email}
                    </p>
                  )}
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
                    autoComplete="new-password"
                    className={clsx(
                      'block w-full px-3 py-2 placeholder-gray-400 border shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                      data.joinError?.password
                        ? 'rounded-t-md border-red-500'
                        : 'rounded-md border-gray-300'
                    )}
                  />
                  {data.joinError?.password && (
                    <p className="px-3 py-2 text-white bg-red-500 shadow-sm rounded-b-md text-opacity-90 sm:text-sm">
                      {data.joinError.password}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={clsx(
                      'block w-full px-3 py-2 placeholder-gray-400 border shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                      data.joinError?.confirmPassword
                        ? 'rounded-t-md border-red-500'
                        : 'rounded-md border-gray-300'
                    )}
                  />
                  {data.joinError?.confirmPassword && (
                    <p className="px-3 py-2 text-white bg-red-500 shadow-sm rounded-b-md text-opacity-90 sm:text-sm">
                      {data.joinError.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex justify-center w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join
                </button>
              </div>
            </fieldset>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
export { loader, action, JoinPage, meta };
