import * as React from 'react';
import { Meta, Scripts, Styles, Routes, useGlobalData } from '@remix-run/react';

function App() {
  const data = useGlobalData<{
    flash?: string;
    errorDetails?: { name: string; message: string };
  }>();

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
        <div className="w-10/12 mx-auto mt-8 max-w-7xl">
          {(data.flash || data.errorDetails) && (
            <div className="mb-2">
              {data.flash && <span>{data.flash}</span>}
              {data.errorDetails && (
                <details className="px-1 py-2 font-mono text-white bg-blue-700 rounded-lg">
                  <summary>Error Details</summary>
                  <pre className="max-w-full overflow-scroll">
                    {JSON.stringify(data.errorDetails, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          <Routes />
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export { App };
