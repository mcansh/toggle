import * as React from 'react';
import { Link } from '@remix-run/react';

function meta() {
  return { title: "Ain't nothing here" };
}

function FourOhFour() {
  return (
    <>
      <video
        autoPlay
        loop
        muted
        src="/thisisfine.mp4"
        className="absolute top-0 left-0 object-cover w-full h-full"
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-4 text-white">
        <h2 className="text-4xl font-medium">Toggle</h2>
        <h1 className="text-3xl">404 | Page not found</h1>
        <Link className="underline" to="/">
          Go home
        </Link>
      </div>
    </>
  );
}

export default FourOhFour;
export { meta };
