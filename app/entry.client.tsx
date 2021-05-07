import ReactDOM from 'react-dom';
import { RemixBrowser } from 'remix';
import * as Sentry from '@sentry/react';
import { Integrations as TracingIntegrations } from '@sentry/tracing';

import pkgJSON from '../package.json';

Sentry.init({
  dsn: `https://22971c82a0f145d7971e6120cd37ae90@o74198.ingest.sentry.io/5588481`,
  integrations: [new TracingIntegrations.BrowserTracing()],
  environment: process.env.NODE_ENV,
  // @ts-expect-error - Remix provides their own incorrect json type
  release: `toggle:${pkgJSON.version}`,
});

ReactDOM.hydrate(
  // @ts-expect-error - @types/react-dom says the 2nd argument to ReactDOM.hydrate() must be a
  // `Element | DocumentFragment | null` but React 16 allows you to pass the
  // `document` object as well. This is a bug in @types/react-dom that we can
  // safely ignore for now.
  <RemixBrowser />,
  document
);
