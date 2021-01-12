import * as React from 'react';
import { useRouteData } from '@remix-run/react';
import type { Loader } from '@remix-run/data';

import type { RemixContext } from '../context';

function meta() {
  return {
    title: 'Health Check | Toggle',
  };
}

interface Data {
  ok: boolean;
}

function HealthCheckPage() {
  const data = useRouteData<Data>();

  if (data.ok) {
    return <h1 className="text-lg">Everything is fine</h1>;
  }

  return (
    <img
      src="/thisisfine.gif"
      alt="cartoon dog sitting at a kitchen table while his house is on fire"
      className="object-contain w-full h-full"
    />
  );
}

const loader: Loader = async ({ context }) => {
  const { prisma } = context as RemixContext;

  try {
    await prisma.flag.count();
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
};

export default HealthCheckPage;
export { loader, meta };
