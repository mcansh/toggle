import * as React from 'react';
import { motion } from 'framer-motion';

import { flashTypes } from '../lib/flash';

import type { Message } from './flash-context';
import { useMessages } from './flash-context';

class Timer {
  public constructor(callback: VoidFunction, delay: number) {
    this.callback = callback;
    this.remaining = delay;

    this.start = Date.now();
    this.timerId = setTimeout(this.callback, this.remaining);
  }

  private callback: VoidFunction;

  private timerId: NodeJS.Timeout;
  private start: number;
  private remaining: number;

  public pause() {
    clearTimeout(this.timerId);
    this.remaining = Date.now() - this.start;
  }

  public resume() {
    this.start = Date.now();
    clearTimeout(this.timerId);
    this.timerId = setTimeout(this.callback, this.remaining);
  }

  public clear() {
    clearTimeout(this.timerId);
  }
}

const FlashMessage: React.VFC<Message> = ({ message, type, id }) => {
  const { removeMessage } = useMessages();
  const ref = React.useRef<HTMLDivElement | HTMLDetailsElement>(null);

  React.useEffect(() => {
    const timer = new Timer(() => removeMessage(id), 5000);

    const target = ref.current;

    if (target) {
      target.addEventListener('mouseenter', () => timer.pause());
      target.addEventListener('mouseleave', () => timer.resume());
    }

    return () => {
      timer.clear();
      if (target) {
        target.removeEventListener('mouseenter', () => timer.pause());
        target.removeEventListener('mouseleave', () => timer.resume());
      }
    };
  }, [id, removeMessage]);

  switch (type) {
    case flashTypes.errorDetails: {
      return (
        <motion.details
          className="px-4 py-2 font-mono text-white bg-blue-700 rounded-lg"
          ref={ref}
          initial={{ y: '-200%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-200%', opacity: 0 }}
        >
          <summary>Error Details</summary>
          <pre className="max-w-full overflow-scroll">{message}</pre>
        </motion.details>
      );
    }

    case flashTypes.error: {
      return (
        <motion.div
          className="px-4 py-2 text-white bg-red-500 rounded-lg"
          ref={ref}
          initial={{ y: '-200%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-200%', opacity: 0 }}
        >
          {message}
        </motion.div>
      );
    }
    case flashTypes.info: {
      return (
        <motion.div
          className="px-4 py-2 text-white bg-indigo-500 rounded-lg"
          ref={ref}
          initial={{ y: '-200%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-200%', opacity: 0 }}
        >
          {message}
        </motion.div>
      );
    }

    case flashTypes.success: {
      return (
        <motion.div
          className="px-4 py-2 text-white bg-green-400 rounded-lg"
          initial={{ y: '-200%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-200%' }}
        >
          {message}
        </motion.div>
      );
    }

    default: {
      throw new Error(`Unhandled Flash Message type "${type}"`);
    }
  }
};

export { FlashMessage };
