import * as React from 'react';
import type { LinksFunction } from '@remix-run/react';
import { Meta, Scripts, Links, useRouteData } from '@remix-run/react';
import type { Loader } from '@remix-run/data';
import { v4 as uuid } from '@lukeed/uuid';
import { Outlet } from 'react-router-dom';

import type { Flash } from './lib/flash';
import { FlashProvider } from './components/flash-context';
import { FlashMessages } from './components/flashes';
import { flashTypes } from './lib/flash';
import { commitSession, getSession } from './sessions';

// eslint-disable-next-line import/extensions, import/no-unresolved, import/order
import globalCSS from 'css:./styles/global.css';

type ExcludesFalse = <T>(x: T | false) => x is T;

const loader: Loader = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));

  const messages = Object.keys(flashTypes)
    .map(key => {
      const message = session.get(key);
      if (!message) return undefined;
      return { type: key, message, id: uuid() };
    })
    .filter((Boolean as unknown) as ExcludesFalse);

  const body = JSON.stringify({ flash: messages });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': await commitSession(session),
    },
  });
};

const links: LinksFunction = () => [{ rel: 'stylesheet', href: globalCSS }];

interface Data {
  flash: Array<{ type: Flash; message: string; id: string }>;
}

function App() {
  const data = useRouteData<Data>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
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
            <Outlet />
          </FlashProvider>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default App;
export { links, loader };
