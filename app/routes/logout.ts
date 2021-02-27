import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import { destroySession, getSession } from '../sessions';

const loader: Loader = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  return redirect('/login', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
};

const LogoutPage = () =>
  // we are redirecting in the loader and
  // remix@0.9 requires a default export at the moment
  null;

export default LogoutPage;
export { loader };
