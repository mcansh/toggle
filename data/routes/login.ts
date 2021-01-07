import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { genCSRF } from "../csrf";
import { RemixContext } from "../context";

export let loader: Loader = ({ session, context }) => {
  const { prisma } = context as RemixContext;
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
