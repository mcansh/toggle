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
    build: require('../../build'),
    getLoadContext() {
      return { prisma };
    },
  })
);

const { PORT = 3000 } = process.env;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `ready - started server on 0.0.0.0:${PORT}, url: http://localhost:${PORT}`
  );
});
