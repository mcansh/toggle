const express = require('express');
const { createRequestHandler } = require('@remix-run/express');
const { PrismaClient } = require('@prisma/client');

const app = express();

app.use(express.static('public'));

const prisma = new PrismaClient();

app.all(
  '*',
  createRequestHandler({
    build: require('./build'),
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
