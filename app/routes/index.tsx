import * as React from "react";
import {
  Form,
  useGlobalData,
  usePendingFormSubmit,
  useRouteData,
} from "@remix-run/react";
import { Flag, FlagType } from "@prisma/client";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { toPascalCase } from "../utils/pascal-case";
import { RemixContext } from "../context";

function meta() {
  return {
    title: "Remix Starter",
    description: "Welcome to remix!",
  };
}

interface Data {
  flags: Array<Flag>;
}

function Index() {
  const { disableFormAutoCompleteForFireFox } = useGlobalData<{
    disableFormAutoCompleteForFireFox: boolean;
  }>();
  const data = useRouteData<Data>();
  const pendingForm = usePendingFormSubmit();
  const [type, setType] = React.useState<FlagType>("boolean");

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>Your Team's Feature Flags</h1>
      {data.flags.length > 0 ? (
        <ul className="border-t border-l border-r border-gray-300">
          <li className="flex justify-between font-medium text-center border-b border-gray-300">
            <span className="flex-1">Feature</span>
            <span className="flex-1">Type</span>
            <span className="flex-1">Value</span>
            <span className="flex-1">Delete</span>
          </li>
          {data.flags.map((flag) => (
            <li
              key={flag.id}
              className="flex justify-between font-medium text-center border-b border-gray-300"
            >
              <span className="flex-1">{flag.feature}</span>
              <span className="flex-1">{flag.type}</span>
              <span className="flex-1">{flag.value}</span>
              <Form className="flex-1" action="/" method="delete">
                <input type="hidden" name="_method" value="DELETE" />
                <input type="hidden" name="featureId" value={flag.id} />
                <button type="submit">&times;</button>
              </Form>
            </li>
          ))}
        </ul>
      ) : (
        <p>Your team hasn't created any flags yet</p>
      )}

      <Form
        action="/"
        method="post"
        autoComplete={disableFormAutoCompleteForFireFox ? "off" : undefined}
      >
        <fieldset disabled={!!pendingForm}>
          <input type="text" name="featureName" placeholder="Name of feature" />
          <div className="flex flex-col">
            <label>
              <span>Boolean (true/false)</span>
              <input
                onChange={(event) =>
                  setType(event.currentTarget.value as FlagType)
                }
                type="radio"
                name="featureType"
                value="boolean"
                checked={type === "boolean"}
              />
            </label>
            <label>
              <span>String</span>
              <input
                onChange={(event) =>
                  setType(event.currentTarget.value as FlagType)
                }
                type="radio"
                name="featureType"
                value="string"
                checked={type === "string"}
              />
            </label>
            <label>
              <span>Number</span>
              <input
                onChange={(event) =>
                  setType(event.currentTarget.value as FlagType)
                }
                type="radio"
                name="featureType"
                value="number"
                checked={type === "number"}
              />
            </label>
          </div>
          {type ? (
            type === "boolean" ? (
              <select name="featureValue" defaultValue="true">
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : type === "string" ? (
              <input type="text" name="featureValue" placeholder="Value" />
            ) : (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="featureValue"
                placeholder="Value"
              />
            )
          ) : null}
          <button type="submit">Create</button>
        </fieldset>
      </Form>
    </div>
  );
}

let loader: Loader = async ({ session, context }) => {
  const { prisma } = context as RemixContext;
  const userId = session.get("userId");

  if (!userId) return redirect("/login");

  const flags = await prisma.flag.findMany({});

  return { flags };
};

const action: Action = async ({ request, session, context }) => {
  const { prisma } = context as RemixContext;
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
    const featureType = body.get("featureType") as FlagType;
    const featureValue = body.get("featureValue") as string;

    if (teamId) {
      await prisma.flag.create({
        data: {
          feature: toPascalCase(featureName),
          type: featureType,
          value: featureValue,
          createdBy: {
            connect: {
              id: userId,
            },
          },
          lastUpdatedBy: {
            connect: {
              id: userId,
            },
          },
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
          createdBy: {
            connect: {
              id: userId,
            },
          },
          lastUpdatedBy: {
            connect: {
              id: userId,
            },
          },
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

export default Index;
export { loader, action, meta };
