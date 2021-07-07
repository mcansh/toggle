import * as React from 'react';
import { useRouteData } from 'remix';
import { json } from 'remix-utils';

import { prisma } from '../db';

import type { LoaderFunction } from 'remix';

interface RouteData {
  ok: boolean;
}

const loader: LoaderFunction = async () => {
  try {
    await prisma.flag.count();
    return json<RouteData>({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return json<RouteData>({ ok: false }, { status: 500 });
  }
};

function meta() {
  return {
    title: 'Health Check • Toggle',
  };
}

function HealthCheckPage() {
  const data = useRouteData<RouteData>();

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

export default HealthCheckPage;
export { loader, meta };
