import * as React from "react";
import { Form, Link, usePendingFormSubmit } from "@remix-run/react";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { RemixContext } from "../context";
import { verify } from "argon2";

function meta() {
  return {
    title: "Login | Remix Starter",
    description: "Welcome to remix!",
  };
}

function Login() {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="m-4">
      <h1 className="mb-4 text-3xl font-medium text-center">
        Welcome Back to Feature Flags!
      </h1>
      <Form method="post" action="/login">
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="email"
            name="email"
            className="w-full border-2 rounded"
          />
          <input
            type="password"
            autoComplete="password"
            placeholder="password"
            name="password"
            className="w-full border-2 rounded"
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

const loader: Loader = ({ session }) => {
  if (session.get("userId")) {
    return redirect("/");
  }

  return {};
};

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);

  const email = body.get("email") as string;
  const password = body.get("password") as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      session.flash("flash", "Invalid credentials");
      return redirect("/login");
    }

    if (user.hashedPassword === '""') {
      session.set("earlyBirdUserId", user.id);
      return redirect("/profile/change-password");
    }

    const verified = await verify(user.hashedPassword, password);

    if (!verified) {
      session.flash("flash", "Invalid credentials");
      return redirect("/login");
    }

    session.set("userId", user.id);

    const returnTo = session.get("returnTo");

    if (returnTo) {
      return redirect(returnTo);
    }

    return redirect("/");
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      session.flash("flash", error.message);
    }
    return redirect("/login");
  }
};

export default Login;
export { meta, loader, action };
