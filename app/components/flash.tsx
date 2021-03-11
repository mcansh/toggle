import * as React from 'react';
import { motion } from 'framer-motion';
import type { Except } from 'type-fest';
import clsx from 'clsx';

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

const DetailsFlashMessage: React.VFC<Except<Message, 'type'>> = ({
  message,
  id,
}) => {
  const { removeMessage } = useMessages();
  const detailsRef = React.useRef<HTMLDetailsElement>(null);

  React.useEffect(() => {
    const timer = new Timer(() => removeMessage(id), 5000);

    const target = detailsRef.current;

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

  return (
    <motion.details
      className="px-4 py-2 font-mono text-white bg-blue-700 rounded-lg"
      ref={detailsRef}
      initial={{ y: '-200%', opacity: 0 }}
      animate={{ y: '0%', opacity: 1 }}
      exit={{ y: '-200%', opacity: 0 }}
    >
      <summary>Error Details</summary>
      <pre className="max-w-full overflow-scroll">{message}</pre>
    </motion.details>
  );
};

const DefaultFlashMessage: React.VFC<Message> = ({ message, type, id }) => {
  const { removeMessage } = useMessages();
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = new Timer(() => removeMessage(id), 5000);

    const target = divRef.current ?? detailsRef.current;

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

  return (
    <motion.div
      className={clsx('px-4 py-2 text-white rounded-lg', {
        'bg-red-500': type === flashTypes.error,
        'bg-indigo-500': type === flashTypes.info,
        'bg-green-400': type === flashTypes.success,
      })}
      ref={divRef}
      initial={{ y: '-200%', opacity: 0 }}
      animate={{ y: '0%', opacity: 1 }}
      exit={{ y: '-200%', opacity: 0 }}
    >
      {message}
    </motion.div>
  );
};

const FlashMessage: React.VFC<Message> = ({ message, type, id }) => {
  switch (type) {
    case flashTypes.errorDetails: {
      return <DetailsFlashMessage id={id} message={message} />;
    }

    default: {
      return <DefaultFlashMessage id={id} message={message} type={type} />;
    }
  }
};

export { FlashMessage };
