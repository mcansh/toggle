import * as React from "react";
import { Link, useRouteData } from "@remix-run/react";
import { FeatureChannel, Flag, Team } from "@prisma/client";
import { Loader, redirect } from "@remix-run/data";
import { RemixContext } from "../context";
import PlusIcon from "../components/icons/solid/plus";

function meta() {
  return {
    title: "Toggle",
    description: "Welcome to Toggle!",
  };
}

interface Data {
  teams: Array<
    Team & { featureChannels: Array<FeatureChannel & { flags: Array<Flag> }> }
  >;
  teamCount: number;
}

function Index() {
  const data = useRouteData<Data>();

  return (
    <div className="max-w-screen-md p-4 mx-auto">
      <h1>Your Team's Feature Channels</h1>
      {data.teamCount === 0 ? (
        <p>Your team hasn't created any channels yet</p>
      ) : (
        data.teams.map((team) => (
          <div key={team.id}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">{team.name} Feature Channels</h2>
              <Link to={`/channel/${team.id}/new`}>
                <span className="sr-only">Create new Channel</span>
                <PlusIcon className="text-black" />
              </Link>
            </div>

            <ul className="pl-6 list-disc">
              {team.featureChannels.map((channel) => (
                <li key={channel.id}>
                  <div className="space-x-2">
                    <Link to={`/channel/${team.id}/${channel.slug}`}>
                      {channel.name} - {channel.flags.length} Flag
                      {channel.flags.length === 1 ? "" : "s"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

const loader: Loader = async ({ session, context }) => {
  const { prisma } = context as RemixContext;
  const userId = session.get("userId");

  if (!userId) {
    session.set("returnTo", "/");
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      teams: { select: { id: true } },
    },
  });

  if (!user) {
    session.unset("userId");
    return redirect("/login");
  }

  const ids = user.teams.map((team) => team.id);

  const teams = await prisma.team.findMany({
    where: {
      id: { in: ids },
    },
    include: {
      featureChannels: {
        include: { flags: true },
      },
    },
  });

  return { teams, teamCount: teams.length };
};

export default Index;
export { loader, meta };
