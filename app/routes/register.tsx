import * as React from "react";
import {
  Form,
  Link,
  usePendingFormSubmit,
  useRouteData,
} from "@remix-run/react";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { RemixContext } from "../context";
import { genCSRF } from "../utils/csrf";

function meta() {
  return {
    title: "Register | Remix Starter",
    description: "Welcome to remix!",
  };
}

function Register() {
  const pendingForm = usePendingFormSubmit();
  const { csrf } = useRouteData<{ csrf: string }>();

  return (
    <div className="m-4">
      <h1 className="mb-4 text-3xl font-medium text-center">
        Welcome to Feature Flags!
      </h1>
      <Form method="post" action="/register">
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <input type="hidden" name="_csrf" value={csrf} />
          <input
            type="text"
            autoComplete="name"
            placeholder="name"
            name="name"
            className="border-2 rounded"
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="email"
            name="email"
            className="border-2 rounded"
          />
          <input
            type="text"
            autoComplete="username"
            placeholder="username"
            name="username"
            className="border-2 rounded"
          />
          <button
            type="submit"
            className="py-1 font-medium leading-loose text-white uppercase transition duration-150 bg-pink-500 rounded-full shadow-lg hover:bg-pink-800 focus:bg-pink-800"
          >
            Register
          </button>
        </fieldset>
      </Form>

      <div className="mt-4">
        <h2>
          Already have an account yet? Awesome, you can{" "}
          <Link
            className="text-blue-500 transition duration-150 hover:text-blue-800 focus:text-blue-800 ease"
            to="/login"
          >
            log in
          </Link>{" "}
          here
        </h2>
      </div>
    </div>
  );
}

const loader: Loader = async ({ session }) => {
  if (session.get("userId")) {
    return redirect("/");
  }

  const csrf = genCSRF();
  session.set("csrf", csrf);
  return { csrf };
};

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);

  const name = body.get("name") as string;
  const email = body.get("email") as string;
  const username = body.get("username") as string;
  // const csrf = body.get("_csrf") as string;

  // const sessionCSRF = session.get("csrf");

  // if (csrf !== sessionCSRF) {
  //   session.flash("flash", `invalid csrf`);

  //   return redirect("/register");
  // }

  session.unset("csrf");

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
      },
    });

    session.set("userId", user.id);

    return redirect("/");
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      session.flash("flash", error.message);
    }
    return redirect("/register");
  }
};

export default Register;
export { loader, action, Register, meta };
