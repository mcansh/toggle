const express = require('express');
const { createRequestHandler } = require('@remix-run/express');
const { PrismaClient } = require('@prisma/client');

const app = express();

const prisma = new PrismaClient();

app.use(express.static('public'));

app.all(
  '*',
  createRequestHandler({
    getLoadContext() {
      return { prisma };
    },
  })
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express server started on http://localhost:${port}`);
});
