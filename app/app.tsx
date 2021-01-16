import * as React from 'react';
import { Meta, Scripts, Styles, Routes, useGlobalData } from '@remix-run/react';

import type { Flash } from './lib/flash';
import { FlashProvider } from './components/flash-context';
import { FlashMessages } from './components/flashes';

interface Data {
  flash: Array<{ type: Flash; message: string; id: string }>;
}

function App() {
  const data = useGlobalData<Data>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Styles />
      </head>
      <body>
        <noscript>
          <div className="fixed top-0 left-0 p-2 text-white bg-pink-500 sm:rounded-lg sm:top-2 sm:left-2 sm:max-w-md">
            While this app will technically work without javascript, you&apos;ll
            have a happier time if you enable it{' '}
            <span role="img" aria-label="smiley face">
              😃
            </span>
          </div>
          <div className="mt-20" />
        </noscript>
        <div className="w-10/12 h-full mx-auto max-w-7xl">
          <FlashProvider messages={data.flash}>
            <FlashMessages />
            <Routes />
          </FlashProvider>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export { App };
