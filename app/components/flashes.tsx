import * as React from 'react';

import type { Flash } from '../lib/flash';

import { FlashMessage } from './flash';

interface Props {
  messages: Array<{ type: Flash; message: string }>;
}

const FlashMessages: React.VFC<Props> = ({ messages }) => (
  <div className="absolute grid w-10/12 gap-2 mb-2 top-4">
    {messages.map(({ message, type }) => (
      <FlashMessage key={type} type={type as Flash} message={message} />
    ))}
  </div>
);

export { FlashMessages };
