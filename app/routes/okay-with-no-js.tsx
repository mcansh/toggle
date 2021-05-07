import type * as React from 'react';
import type { ActionFunction, LoaderFunction } from 'remix';
import { redirect } from 'remix';

import { withSession } from '../lib/with-session';

const loader: LoaderFunction = () => redirect('/');

const action: ActionFunction = ({ request }) =>
  withSession(request, session => {
    session.set('OkayWithNoJs', 'true');
    return redirect('/');
  });

const OkayWithNoJsPage: React.VFC = () => null;

export default OkayWithNoJsPage;
export { loader, action };
