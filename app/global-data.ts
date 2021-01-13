import type { Loader } from '@remix-run/data';

import { flashTypes } from './lib/flash';

export const loader: Loader = ({ session }) => {
  const errorDetails = session.get(flashTypes.errorDetails);
  const success = session.get(flashTypes.success);
  const error = session.get(flashTypes.error);
  const info = session.get(flashTypes.info);

  return {
    flash: {
      errorDetails,
      success,
      error,
      info,
    },
  };
};
