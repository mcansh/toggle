import type { User } from '@prisma/client';
import { redirect } from '@remix-run/data';

import type { ActionArgs, LoaderArgs } from '../context';
import { commitSession, getSession } from '../sessions';

async function verifyAuth<Params>({
  request,
  context,
}: LoaderArgs<Params> | ActionArgs<Params>): Promise<User> {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');
  const { pathname } = new URL(request.url);

  if (!userId) {
    session.set('returnTo', pathname);
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  const user = await context.prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    session.unset('userId');
    session.set('returnTo', pathname);
    return redirect('/login', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  return user;
}

export { verifyAuth };
