// import Redis from 'ioredis';
// import cuid from 'cuid';
import {
  // createSessionStorage,
  createCookieSessionStorage,
} from '@remix-run/data';
// import { addDays, differenceInMilliseconds } from 'date-fns';

// const redis = new Redis(process.env.REDIS_URL);

// function createRedisSessionStorage({
//   cookie,
// }: {
//   cookie: Parameters<typeof createSessionStorage>['0']['cookie'];
// }) {
//   return createSessionStorage({
//     cookie,
//     async createData(data, expiresAt = addDays(new Date(), 14)) {
//       const id = `toggle:${cuid()}`;
//       const diff = differenceInMilliseconds(expiresAt, new Date());
//       await redis.set(id, JSON.stringify(data), 'PX', diff);
//       return id;
//     },
//     async readData(id) {
//       const result = await redis.get(id);
//       if (!result) return null;
//       return JSON.parse(result);
//     },
//     async updateData(id, data, expiresAt = addDays(new Date(), 14)) {
//       const diff = differenceInMilliseconds(expiresAt, new Date());
//       await redis.set(id, JSON.stringify(data), 'PX', diff);
//     },
//     async deleteData(id) {
//       await redis.del(id);
//     },
//   });
// }

const {
  getSession,
  commitSession,
  destroySession,
} = createCookieSessionStorage({
  // This is either a Cookie (or a set of CookieOptions) that
  // describe the session cookie to use.
  cookie: {
    name: '__session',
    secrets: [process.env.SESSION_PASSWORD],
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 14, // 2 weeks
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
});

export { getSession, commitSession, destroySession };
