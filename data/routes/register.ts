import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { RemixContext } from "../context";
import { genCSRF } from "../csrf";

export const loader: Loader = async ({ session }) => {
  if (session.get("userId")) {
    return redirect("/");
  }

  const csrf = genCSRF();
  session.set("csrf", csrf);
  return { csrf };
};

export let action: Action = async ({ session, request, context }) => {
  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);

  const name = body.get("name") as string;
  const email = body.get("email") as string;
  const username = body.get("username") as string;
  const csrf = body.get("_csrf") as string;

  const sessionCSRF = session.get("csrf");

  if (csrf !== sessionCSRF) {
    session.flash("flash", `invalid csrf`);

    return redirect("/register");
  }

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
