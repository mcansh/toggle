import * as React from "react";
import {
  Form,
  Link,
  usePendingFormSubmit,
  useRouteData,
} from "@remix-run/react";

export function meta() {
  return {
    title: "Login | Remix Starter",
    description: "Welcome to remix!",
  };
}

export default function Login() {
  const pendingForm = usePendingFormSubmit();
  const { csrf } = useRouteData<{ csrf: string }>();

  return (
    <div className="m-4">
      <h1 className="mb-4 text-3xl font-medium text-center">
        Welcome Back to Feature Flags!
      </h1>
      <Form method="post" action="/login">
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <input type="hidden" name="_csrf" value={csrf} />
          <input
            type="email"
            autoComplete="email"
            placeholder="email"
            name="email"
            className="border-2 rounded"
          />
          <button
            type="submit"
            className="py-1 font-medium leading-loose text-white uppercase transition duration-150 bg-pink-500 rounded-full shadow-lg hover:bg-pink-800 focus:bg-pink-800"
          >
            Log in
          </button>
        </fieldset>
      </Form>

      <div className="mt-4">
        <h2>
          Don't have an account yet? No sweat, you can{" "}
          <Link
            className="text-blue-500 transition duration-150 hover:text-blue-800 focus:text-blue-800 ease"
            to="/register"
          >
            sign up
          </Link>{" "}
          here
        </h2>
      </div>
    </div>
  );
}
