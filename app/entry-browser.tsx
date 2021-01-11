import ReactDOM from "react-dom";
import Remix from "@remix-run/react/browser";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import { App } from "./app";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  autoSessionTracking: true,
  integrations: [new Integrations.BrowserTracing()],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

ReactDOM.hydrate(
  // @types/react-dom says the 2nd argument to ReactDOM.hydrate() must be a
  // `Element | DocumentFragment | null` but React 16 allows you to pass the
  // `document` object as well. This is a bug in @types/react-dom that we can
  // safely ignore for now.
  // @ts-ignore
  <Remix>
    <App />
  </Remix>,
  document
);
