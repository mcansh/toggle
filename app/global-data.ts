import type { Loader } from '@remix-run/data';
import { v4 as uuid } from '@lukeed/uuid';

import { flashTypes } from './lib/flash';

type ExcludesFalse = <T>(x: T | false) => x is T;

export const loader: Loader = ({ session }) => {
  const messages = Object.keys(flashTypes)
    .map(key => {
      const message = session.get(key);
      if (!message) return undefined;
      return { type: key, message, id: uuid() };
    })
    .filter((Boolean as unknown) as ExcludesFalse);

  return {
    flash: messages,
  };
};
