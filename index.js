const express = require('express');
const { createRequestHandler } = require('@remix-run/express');

const app = express();

app.use(express.static('public'));

app.all(
  '*',
  createRequestHandler({
    build: require('./build'),
  })
);

const { PORT = 3000 } = process.env;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `ready - started server on 0.0.0.0:${PORT}, url: http://localhost:${PORT}`
  );
});
