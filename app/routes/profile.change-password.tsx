import * as React from "react";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { Form, usePendingFormSubmit } from "@remix-run/react";
import { hash } from "argon2";

import { RemixContext } from "../context";

const ChangePasswordPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();

  return (
    <Form method="POST" action="/profile/change-password">
      <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
        <input
          type="password"
          autoComplete="new-password"
          placeholder="password"
          name="password"
          className="w-full border-2 rounded"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="confirm password"
          name="confirmPassword"
          className="w-full border-2 rounded"
        />
        <button
          type="submit"
          className="py-1 font-medium leading-loose text-white uppercase transition duration-150 bg-pink-500 rounded-full shadow-lg hover:bg-pink-800 focus:bg-pink-800"
        >
          Change Password
        </button>
      </fieldset>
    </Form>
  );
};

const loader: Loader = ({ session }) => {
  const userId = session.get("earlyBirdUserId") as string;
  if (!userId) {
    return redirect("/login");
  }

  return {};
};

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const userId = session.get("earlyBirdUserId") as string;
  const returnTo = session.get("returnTo") as string;

  const { pathname } = new URL(request.url);

  if (!userId) {
    return redirect("/login");
  }

  try {
    const body = await parseFormBody(request);
    const password = body.get("password") as string;
    const confirmPassword = body.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      session.set("flash", "password do not match");
      return redirect(pathname);
    }

    const hashedPassword = await hash(password);

    await prisma.user.update({
      data: { hashedPassword },
      where: { id: userId },
    });

    return redirect(returnTo ?? "/");
  } catch (error) {
    console.error(error);
    session.set("flash", error.message);
    return redirect(pathname);
  }
};

export default ChangePasswordPage;
export { loader, action };
