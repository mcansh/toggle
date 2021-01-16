import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import type { Flash } from '../lib/flash';

import { useMessages } from './flash-context';
import { FlashMessage } from './flash';

const FlashMessages: React.VFC = () => {
  const { messages } = useMessages();

  return (
    <motion.div
      transition={{ staggerChildren: 1 }}
      className="absolute grid w-10/12 gap-2 mb-2 top-4"
    >
      <AnimatePresence>
        {messages.map(({ message, type, id }) => (
          <FlashMessage
            key={id}
            id={id}
            type={type as Flash}
            message={message}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export { FlashMessages };
