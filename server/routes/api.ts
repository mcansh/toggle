import { Router as router } from 'express';

const api = router();

// eslint-disable-next-line arrow-body-style
api.all('*', (_req, res) => {
  return res.status(501).json({
    message: "our api isn't quite ready for you yet",
  });
});

export { api };
