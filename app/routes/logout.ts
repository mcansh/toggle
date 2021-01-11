import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

const loader: Loader = async ({ session }) => {
  await session.destroy();
  return redirect('/login');
};

const LogoutPage = () =>
  // we are redirecting in the loader and
  // remix@0.9 requires a default export at the moment
  null;
export default LogoutPage;
export { loader };
