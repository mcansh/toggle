import * as React from 'react';

import type { Flash } from '../lib/flash';
import { flashTypes } from '../lib/flash';

interface Props {
  message: string;
  type: Flash;
}

const FlashMessage: React.VFC<Props> = ({ message, type }) => {
  switch (type) {
    case flashTypes.errorDetails: {
      return (
        <details className="px-4 py-2 font-mono text-white bg-blue-700 rounded-lg">
          <summary>Error Details</summary>
          <pre className="max-w-full overflow-scroll">{message}</pre>
        </details>
      );
    }

    case flashTypes.error: {
      return (
        <div className="px-4 py-2 text-white bg-red-500 rounded-lg">
          {message}
        </div>
      );
    }
    case flashTypes.info: {
      return (
        <div className="px-4 py-2 text-white bg-indigo-500 rounded-lg">
          {message}
        </div>
      );
    }

    case flashTypes.success: {
      return (
        <div className="px-4 py-2 text-white bg-green-400 rounded-lg">
          {message}
        </div>
      );
    }

    default: {
      throw new Error(`Unhandled Flash Message type "${type}"`);
    }
  }
};

export { FlashMessage };
