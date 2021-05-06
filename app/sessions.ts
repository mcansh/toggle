import { createSessionStorage } from 'remix';
import Redis from 'ioredis';
import cuid from 'cuid';

function createRedisSessionStorage({ cookie }: any) {
  const redis = new Redis(process.env.REDIS_URL, {
    keyPrefix: 'toggle:',
  });

  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      // `expires` is a Date after which the data should be considered
      // invalid. You could use it to invalidate the data somehow or
      // automatically purge this record from your database.
      const id = cuid();

      const diff =
        (expires ? expires.getTime() : Date.now() + 86400 * 14) - Date.now();

      await redis.set(id, JSON.stringify(data), 'px', diff);

      return id;
    },
    async readData(id) {
      const session = await redis.get(id);
      if (!session) return null;
      const data = JSON.parse(session);
      return data;
    },
    async updateData(id, data, expires) {
      const diff =
        (expires ? expires.getTime() : Date.now() + 86400 * 14) - Date.now();

      await redis.set(id, JSON.stringify(data), 'px', diff);
    },
    async deleteData(id) {
      await redis.del(id);
    },
  });
}

const { getSession, commitSession, destroySession } = createRedisSessionStorage(
  {
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
  }
);

export { getSession, commitSession, destroySession };
