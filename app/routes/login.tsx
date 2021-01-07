import * as React from "react";
import {
  Form,
  Link,
  usePendingFormSubmit,
  useRouteData,
} from "@remix-run/react";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { genCSRF } from "../utils/csrf";
import { RemixContext } from "../context";

function meta() {
  return {
    title: "Login | Remix Starter",
    description: "Welcome to remix!",
  };
}

function Login() {
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

let loader: Loader = ({ session, context }) => {
  const { prisma } = context as RemixContext;
  if (session.get("userId")) {
    return redirect("/");
  }

  const csrf = genCSRF();
  session.set("csrf", csrf);
  return { csrf };
};

let action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);

  const email = body.get("email") as string;
  const csrf = body.get("_csrf") as string;

  const sessionCSRF = session.get("csrf");

  if (csrf !== sessionCSRF) {
    session.flash("flash", `invalid csrf`);

    return redirect("/login");
  }

  session.unset("csrf");

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      session.set("userId", user.id);
      if (user.teamId) {
        session.set("teamId", user.teamId);
      }
    }

    return redirect("/");
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      session.flash("flash", error.message);
    }
    return redirect("/login");
  }
};

export default Login;
export { meta, loader, action };
