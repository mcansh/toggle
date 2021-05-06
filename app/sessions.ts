import { createCookieSessionStorage } from 'remix';

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
