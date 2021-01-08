import * as React from "react";
import { FeatureChannel, Flag, FlagType } from "@prisma/client";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { Form, usePendingFormSubmit, useRouteData } from "@remix-run/react";
import { RemixContext } from "../context";
import { toPascalCase } from "../utils/pascal-case";
import { Except } from "type-fest";
import { format, isToday, parseISO } from "date-fns";

type StringDateFlag = Except<Flag, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface Data {
  channel: FeatureChannel & { flags: Array<StringDateFlag> };
}

const FeatureChannelPage: React.VFC = () => {
  const data = useRouteData<Data>();
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>{data.channel.name} Feature Flags</h1>
      {data.channel.flags.length > 0 ? (
        <div className="px-2">
          <table className="w-full border rounded-md table-auto">
            <thead>
              <tr className="text-left border-b divide-x">
                <th>Feature</th>
                <th>Type</th>
                <th>Value</th>
                <th>Updated At</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.channel.flags.map((flag) => {
                const flagUpdatedDate = parseISO(flag.updatedAt);
                const createdToday = isToday(flagUpdatedDate);
                return (
                  <tr key={flag.id} className="divide-x">
                    <td>{flag.feature}</td>
                    <td>{flag.type}</td>
                    <td>{flag.value}</td>
                    <td>
                      <time dateTime={flag.updatedAt}>
                        {format(flagUpdatedDate, createdToday ? "p" : "P")}
                      </time>
                    </td>
                    <td>
                      <Form
                        className="text-center"
                        action={`/channel/${data.channel.name}`}
                        method="delete"
                      >
                        <input type="hidden" name="_method" value="DELETE" />
                        <input type="hidden" name="featureId" value={flag.id} />
                        <button type="submit">&times;</button>
                      </Form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Form
            autoComplete="off"
            method="POST"
            action={`/channel/${data.channel.name}`}
          >
            <fieldset disabled={!!pendingForm} className="flex divide-x">
              <input
                placeholder="MyNewFeature"
                className="border-0"
                type="text"
                name="name"
              />
              <select
                className="border-r-0 border-gray-200 border-y-0"
                name="type"
              >
                <option value="boolean">Boolean</option>
                <option value="string">String</option>
                <option value="number">Number</option>
              </select>
              <input
                placeholder="true"
                className="border-gray-200"
                type="text"
                name="value"
              />
              <button className="border-gray-200" type="submit">
                ✅
              </button>
            </fieldset>
          </Form>
        </div>
      ) : (
        <p>Your team hasn't created any flags yet</p>
      )}
    </div>
  );
};

const loader: Loader = async ({ context, session, params }) => {
  const { prisma } = context as RemixContext;

  const teamId = session.get("teamId");

  const teamChannels = await prisma.team.findUnique({
    where: { id: teamId },
    select: { featureChannels: true },
  });

  const matchingChannel = teamChannels?.featureChannels.find(
    (c) => c.name.toLowerCase() === params.channelName.toLowerCase()
  );

  if (matchingChannel) {
    const channel = await prisma.featureChannel.findUnique({
      where: { id: matchingChannel.id },
      include: { flags: { orderBy: { updatedAt: "desc" } } },
    });

    return { channel };
  }

  return new Response("{}", {
    status: 404,
    headers: {
      "content-type": "application/json",
    },
  });
};

const action: Action = async ({ context, params, request, session }) => {
  // verify session
  const userId = session.get("userId");
  const teamId = session.get("teamId");

  const { pathname } = new URL(request.url);

  if (!userId || !teamId) {
    session.set("returnTo", pathname);
    return redirect("/login");
  }

  const { prisma } = context as RemixContext;
  const body = await parseFormBody(request);
  const method = body.get("_method") ?? request.method;

  if (method === "DELETE") {
    const featureId = body.get("featureId") as string;
    await prisma.flag.delete({
      where: { id: featureId },
    });
    return redirect(pathname);
  }

  if (method === "POST") {
    const channel = await prisma.featureChannel.findFirst({
      where: {
        teamId,
        name: params.channelName,
      },
    });

    if (!channel) {
      session.flash("flash", "something went wrong");
      return redirect(pathname);
    }

    await prisma.flag.create({
      data: {
        createdBy: {
          connect: { id: userId },
        },
        lastUpdatedBy: {
          connect: { id: userId },
        },
        feature: toPascalCase(body.get("name") as string),
        type: body.get("type") as FlagType,
        value: body.get("value") as string,
        Team: {
          connect: { id: teamId },
        },
        FeatureChannel: {
          connect: { id: channel.id },
        },
      },
    });
  }

  session.flash("flash", `invalid request method "${method}"`);
  return redirect(pathname);
};

export default FeatureChannelPage;
export { loader, action };
