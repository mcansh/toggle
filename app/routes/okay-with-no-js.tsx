import type * as React from 'react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { commitSession, getSession } from '../sessions';

const loader: LoaderFunction = () => redirect('/');

const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  session.set('OkayWithNoJs', 'true');
  return redirect('/', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
};

const OkayWithNoJsPage: React.VFC = () => null;

export default OkayWithNoJsPage;
export { loader, action };
