import express from 'express';
import { createRequestHandler } from '@remix-run/express';

import { prisma } from './prisma';
import { getUserChannels } from './routes/channels';
import { getChannel } from './routes/channel.$channel';

const app = express();

app.use(express.static('public'));

app.get('/api/channels', getUserChannels);
app.get('/api/channel/:channel', getChannel);

app.all(
  '*',
  createRequestHandler({
    getLoadContext() {
      return { prisma };
    },
  })
);

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express server started on http://localhost:${port}`);
});
