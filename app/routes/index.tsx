import * as React from "react";
import { Link, useRouteData } from "@remix-run/react";
import { FeatureChannel } from "@prisma/client";
import { Loader, redirect } from "@remix-run/data";
import { RemixContext } from "../context";
import { formatRelative } from "date-fns";
import { Except } from "type-fest";

function meta() {
  return {
    title: "Feature Flags",
    description: "Welcome to Feature Flags!",
  };
}

interface Data {
  channels: Array<
    Except<FeatureChannel, "updatedAt" | "createdAt"> & {
      updatedAt: string;
      createdAt: string;
    }
  >;
}

function Index() {
  const data = useRouteData<Data>();

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>Your Team's Feature Channels</h1>
      {data.channels.length > 0 ? (
        <ul className="pl-6 list-disc">
          {data.channels.map((channel) => (
            <li key={channel.id}>
              <div className="space-x-2">
                <Link to={`/channel/${channel.slug}`}>{channel.name}</Link>
                <span>
                  Created:{" "}
                  <time dateTime={channel.createdAt}>
                    {formatRelative(new Date(channel.createdAt), new Date())}
                  </time>
                </span>
                <span>
                  Last Updated:{" "}
                  <time dateTime={channel.updatedAt}>
                    {formatRelative(new Date(channel.updatedAt), new Date())}
                  </time>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Your team hasn't created any channels yet</p>
      )}
    </div>
  );
}

const loader: Loader = async ({ session, context }) => {
  const { prisma } = context as RemixContext;
  const userId = session.get("userId");
  const teamId = session.get("teamId");

  if (!userId || !teamId) {
    session.set("returnTo", "/");
    return redirect("/login");
  }

  const channels = await prisma.featureChannel.findMany({
    where: { teamId },
  });

  return { channels };
};

export default Index;
export { loader, meta };
