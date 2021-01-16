import * as React from 'react';

import type { Flash } from '../lib/flash';

export type Message = {
  id: string;
  type: Flash;
  message: string;
};

interface Context {
  messages: Array<Message>;
  removeMessage: (id: string) => void;
}

const FlashContext = React.createContext<Context | undefined>(undefined);

const FlashProvider: React.FC<Pick<Context, 'messages'>> = ({
  children,
  messages = [],
}) => {
  const [currentMessages, setMessages] = React.useState(messages);
  const removeMessage = (id: string) =>
    setMessages(old => old.filter(message => message.id !== id));

  React.useEffect(() => {
    if (messages.length !== currentMessages.length) {
      setMessages(messages);
    }
  }, [messages]);

  return (
    <FlashContext.Provider value={{ messages: currentMessages, removeMessage }}>
      {children}
    </FlashContext.Provider>
  );
};

function useMessages() {
  const context = React.useContext(FlashContext);
  if (!context) {
    throw new Error(`useMessages must be used within a FlashProvider`);
  }
  return context;
}

export { useMessages, FlashProvider };
