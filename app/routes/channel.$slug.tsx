import * as React from "react";
import { FeatureChannel, Flag, FlagType } from "@prisma/client";
import { Action, Loader, parseFormBody, redirect } from "@remix-run/data";
import { Form, usePendingFormSubmit, useRouteData } from "@remix-run/react";
import { RemixContext } from "../context";
import { toPascalCase } from "../utils/pascal-case";
import { Except } from "type-fest";
import { format, isToday, parseISO } from "date-fns";

function meta({ data }: { data: Data }) {
  if (!data.channel) {
    return {
      title: "Feature Flags",
    };
  }

  return {
    title: `${data.channel.name} Feature Flags`,
  };
}

type StringDateFlag = Except<Flag, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface Data {
  channel: (FeatureChannel & { flags: Array<StringDateFlag> }) | undefined;
}

interface BooleanForm {
  name: string;
  type: "boolean";
  value: boolean;
}

interface NumberForm {
  name: string;
  type: "number";
  value: number;
}

interface StringForm {
  name: string;
  type: "string";
  value: string;
}

type Form = BooleanForm | NumberForm | StringForm;

const FeatureChannelPage: React.VFC = () => {
  const data = useRouteData<Data>();
  const pendingForm = usePendingFormSubmit();
  const [form, setForm] = React.useState<Form>({
    name: "",
    type: "string",
    value: "",
  });

  if (!data.channel) {
    return <h1>Channel not found</h1>;
  }

  function handleFormChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    return setForm((old) => ({
      ...old,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <h1 className="py-2 text-2xl font-medium">
        {data.channel.name} Feature Flags
      </h1>
      {data.channel.flags.length > 0 ? (
        <>
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
                        action={`/channel/${data.channel?.slug}`}
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
            className="w-10/12 mx-auto mt-8 max-w-7xl"
          >
            <fieldset disabled={!!pendingForm} className="grid gap-6">
              <label className="block">
                <span>Name: </span>
                <input
                  placeholder="MyNewFeature"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                />
              </label>
              <label className="block">
                <span>Type: </span>
                <select
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                >
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                  <option value="number">Number</option>
                </select>
              </label>
              <label className="block">
                <span>Value: </span>
                {form.type === "boolean" ? (
                  <select
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    name="value"
                    value={form.type}
                    onChange={handleFormChange}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : form.type === "number" ? (
                  <input
                    placeholder="25"
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    type="text"
                    name="value"
                    value={form.value}
                    onChange={handleFormChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                ) : (
                  <input
                    placeholder="http://someapi.ff.io"
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    type="text"
                    name="value"
                    value={form.value}
                    onChange={handleFormChange}
                  />
                )}
              </label>
              <button
                className="block w-full py-2 mt-1 leading-relaxed border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                type="submit"
              >
                Create ✅
              </button>
            </fieldset>
          </Form>
        </>
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
    (c) => c.slug === params.slug
  );

  if (matchingChannel) {
    const channel = await prisma.featureChannel.findUnique({
      where: { id: matchingChannel.id },
      include: { flags: { orderBy: { updatedAt: "desc" } } },
    });

    return { channel };
  }

  return new Response(JSON.stringify({ channel: undefined }), {
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
        slug: params.slug,
      },
    });

    if (!channel) {
      session.flash("flash", "something went wrong");
      return redirect(pathname);
    }

    const featureName = body.get("name") as string;
    const featureType = body.get("type") as FlagType;
    const featureValue = body.get("value") as string;

    await prisma.flag.create({
      data: {
        createdBy: {
          connect: { id: userId },
        },
        lastUpdatedBy: {
          connect: { id: userId },
        },
        feature: featureName.includes(" ")
          ? toPascalCase(featureName)
          : featureName,
        type: featureType,
        value: featureValue,
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
export { loader, action, meta };
