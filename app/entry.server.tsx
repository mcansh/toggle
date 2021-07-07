import ReactDOMServer from 'react-dom/server';
import { RemixServer } from 'remix';
import * as Sentry from '@sentry/node';

import pkgJSON from '../package.json';

import { getUserChannels } from './api/routes/channels';
import { getChannel } from './api/routes/channels.$channel';

import type { EntryContext } from 'remix';

Sentry.init({
  dsn: `https://22971c82a0f145d7971e6120cd37ae90@o74198.ingest.sentry.io/5588481`,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
  // @ts-expect-error - Remix provides their own incorrect json type
  release: `toggle:${pkgJSON.version}`,
});

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const { pathname } = new URL(request.url);

  if (pathname === '/api/channels') {
    return getUserChannels(request);
  }

  const regex = /\/api\/channel\/(?<id>[^/]+)/;
  const channelMatch = pathname.match(regex);
  if (channelMatch?.groups?.id) {
    return getChannel(request, { channel: channelMatch.groups.id });
  }

  const markup = ReactDOMServer.renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: {
      ...Object.fromEntries(responseHeaders),
      'Content-Type': 'text/html',
    },
  });
}
