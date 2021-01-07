import { Meta, Scripts, Styles, Routes, useGlobalData } from "@remix-run/react";

function App() {
  let data = useGlobalData<{ flash?: string }>();

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
        <Routes />
        <Scripts />
      </body>
    </html>
  );
}

export { App };
