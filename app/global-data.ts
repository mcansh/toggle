import type { Loader } from '@remix-run/data';

export const loader: Loader = ({ session }) => {
  const flash = session.get('flash');

  return { flash };
};
