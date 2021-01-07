import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { PrismaClient } from "@prisma/client";
import { toPascalCase } from "../pascal-case";

const prisma = new PrismaClient();

let loader: Loader = async ({ session }) => {
  const userId = session.get("userId");

  if (!userId) return redirect("/login");

  const flags = await prisma.flag.findMany({});

  return { flags };
};

const action: Action = async ({ request, session }) => {
  const userId = session.get("userId");
  const teamId = session.get("teamId");

  if (!userId) {
    session.set("continue", request.url);
    return redirect("/login");
  }

  const body = await parseFormBody(request);

  const method = body.get("_method") ?? request.method;

  if (method === "DELETE") {
    const featureId = body.get("featureId") as string | undefined;
    await prisma.flag.delete({
      where: { id: featureId },
    });
    return redirect("/");
  }

  if (method === "POST") {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      session.set("continue", request.url);
      return redirect("/login");
    }

    const featureName = body.get("featureName") as string;
    const featureType = body.get("featureType") as "Boolean" | "String" | "Int";
    const featureValue = body.get("featureValue") as string;

    if (teamId) {
      await prisma.flag.create({
        data: {
          feature: toPascalCase(featureName),
          type: featureType,
          value: featureValue,
          Team: {
            connect: {
              id: teamId,
            },
          },
        },
      });
    } else {
      const team = await prisma.flag.create({
        data: {
          feature: toPascalCase(featureName),
          type: featureType,
          value: featureValue,
          Team: {
            create: {
              name: `${user.username}'s new team`,
              members: {
                connect: { id: userId },
              },
            },
          },
        },
      });

      session.set("teamId", team.id);
    }
    return redirect("/");
  }
};

export { loader, action };
