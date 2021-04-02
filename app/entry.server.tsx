import ReactDOMServer from 'react-dom/server';
import type { EntryContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';

import { getUserChannels } from './api/routes/channels';
import { getChannel } from './api/routes/channels.$channel';

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
