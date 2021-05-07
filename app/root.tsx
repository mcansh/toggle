import * as React from 'react';
import type { LinksFunction, LoaderFunction } from 'remix';
import { Form, Meta, Scripts, Links, useRouteData } from 'remix';
import { v4 as uuid } from '@lukeed/uuid';
import { Outlet } from 'react-router-dom';
import { XIcon } from '@heroicons/react/solid';
import { json } from 'remix-utils';

import globalCSS from './styles/global.css';
import type { Flash } from './lib/flash';
import { flashTypes } from './lib/flash';
import { withSession } from './lib/with-session';

const links: LinksFunction = () => [
  { rel: 'stylesheet', href: globalCSS },
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'alternate icon', href: '/favicon.ico' },
  { rel: 'mask-icon', href: '/flag.svg', color: '#6d28d9' },
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon-16x16.png',
  },
  { rel: 'manifest', href: '/site.webmanifest' },
];

type ExcludesFalse = <T>(x: T | false) => x is T;

interface RouteData {
  flash: Array<{ type: Flash; message: string; id: string }>;
  OkayWithNoJs: boolean;
}

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    const OkayWithNoJs = session.get('OkayWithNoJs') === 'true';

    const messages = Object.keys(flashTypes)
      .map(key => {
        const message = session.get(key);
        if (!message) return undefined;
        return { type: key, message, id: uuid() };
      })
      .filter((Boolean as unknown) as ExcludesFalse);

    return json<RouteData>({ flash: messages as any, OkayWithNoJs });
  });

function App() {
  const data = useRouteData<RouteData>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        {!data.OkayWithNoJs && (
          <noscript>
            <div className="fixed top-0 left-0 flex p-2 text-white bg-pink-500 sm:rounded-lg sm:top-2 sm:left-2 sm:max-w-md">
              <div>
                While this app will technically work without javascript,
                you&apos;ll have a happier time if you enable it{' '}
                <span role="img" aria-label="smiley face">
                  😃
                </span>
              </div>
              <Form method="post" action="/okay-with-no-js">
                <button type="submit">
                  <XIcon />
                </button>
              </Form>
            </div>
            <div className="mt-20" />
          </noscript>
        )}
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

interface ErrorBoundaryProps {
  error: Error;
}

const ErrorBoundary: React.VFC<ErrorBoundaryProps> = ({ error }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <title>Oops!</title>
      <Links />
    </head>
    <body>
      <div>
        <h1>App Error</h1>
        <pre>{error.message}</pre>
        <p>
          Replace this UI with what you want users to see when your app throws
          uncaught errors. The file is at <code>app/App.tsx</code>.
        </p>
      </div>

      <Scripts />
    </body>
  </html>
);

export default App;
export { links, loader, ErrorBoundary };
