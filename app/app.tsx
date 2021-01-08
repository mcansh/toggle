import * as React from "react";
import { Meta, Scripts, Styles, Routes, useGlobalData } from "@remix-run/react";

function App() {
  const data = useGlobalData<{ flash?: string }>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Styles />
      </head>
      <body>
        {data.flash && <pre>{data.flash}</pre>}
        <noscript>
          <div className="fixed top-0 left-0 p-2 text-white bg-pink-500 sm:rounded-lg sm:top-2 sm:left-2 sm:max-w-md">
            While this app will technically work without javascript, you'll have
            a happier time if you enable it 😃
          </div>
          <div className="mt-20" />
        </noscript>
        <Routes />
        <Scripts />
      </body>
    </html>
  );
}

export { App };
