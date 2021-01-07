import { Action, parseFormBody, redirect } from "@remix-run/data";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export let action: Action = async ({ session, request }) => {
  const body = await parseFormBody(request);

  const name = body.get("name") as string;
  const email = body.get("email") as string;
  const username = body.get("username") as string;
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
      },
    });

    session.set("userId", user.id);
    session.set("user.new", "true");
    return redirect("/");
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      session.flash("flash", error.message);
    }
    return redirect("/register");
  }
};
