import type { NowApiHandler } from '@vercel/node';

const handler: NowApiHandler = (_req, res) =>
  res.status(501).json({
    message: "our api isn't quite ready for you yet",
  });

export default handler;
