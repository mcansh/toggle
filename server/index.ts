import path from "path";

import express from "express";
import session from "express-session";
import { createRequestHandler } from "@remix-run/express";
import Redis from "ioredis";
import redisConnect from "connect-redis";
import dotenv from "dotenv-safe";
import { PrismaClient } from "@prisma/client";
import ms from "ms";

function parseFeatureValue(
  type: string,
  value: string
): string | boolean | number {
  return type === "boolean"
    ? JSON.parse(value)
    : type === "number"
    ? Number(value)
    : value;
}

function convertFlagsArrayToObject(
  flags?: Array<any>,
  options: {
    includeExtraProperties: boolean;
  } = {
    includeExtraProperties: false,
  }
): any {
  if (!flags) return {};

  if (options.includeExtraProperties) {
    return flags.reduce((acc, cur) => {
      return {
        ...acc,
        [cur.feature]: {
          ...cur,
          value: parseFeatureValue(cur.type, cur.value),
        },
      };
    }, {});
  }

  return flags.reduce((acc, cur) => {
    return {
      ...acc,
      [cur.feature]: parseFeatureValue(cur.type, cur.value),
    };
  }, {});
}

dotenv.config({
  path: path.join(__dirname, "../.env"),
  example: path.join(__dirname, "../.env.example"),
});

const RedisStore = redisConnect(session);

/* I'm not entirely sure why, but i couldn't get this to work with just a connection string */
const client = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: {},
});

const app = express();

app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_PASSWORD!,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({ client }),
    rolling: true,
    unset: "destroy",
    cookie: {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: ms("15d"),
      sameSite: "strict",
      httpOnly: true,
    },
  })
);

const prisma = new PrismaClient();

app.use(async (req, res, next) => {
  if (!req.url.startsWith("/api")) return next();

  const websiteFlags = await prisma.featureChannel.findUnique({
    where: { id: "ckjndxrkg0021m7iso0db33ml" },
    select: { flags: true },
  });

  const webFlags = convertFlagsArrayToObject(websiteFlags?.flags);

  if (
    typeof webFlags.EnablePublicAPI === "boolean" &&
    webFlags.EnablePublicAPI !== true
  ) {
    return res.status(415).send({
      message: "our api isn't quite ready for you yet",
    });
  }

  return next();
});

app.get("/api/flags", async (_req, res) => {
  const flags = await prisma.flag.findMany({
    where: {
      teamId: "ckjnab6t20006raiszrzenw5t",
    },
  });

  const flagObject = convertFlagsArrayToObject(flags);

  return res.json({ flags: flagObject });
});

app.get("/api/channel/:channelId", async (req, res) => {
  const { channelId } = req.params;

  const channel = await prisma.featureChannel.findUnique({
    where: { id: channelId },
    include: {
      flags: {
        select: {
          createdAt: true,
          feature: true,
          id: true,
          updatedAt: true,
          type: true,
          value: true,
        },
      },
    },
  });

  if (!channel) return res.status(404).json({});

  return res.json({
    channel: {
      ...channel,
      flags: convertFlagsArrayToObject(channel?.flags, {
        includeExtraProperties: true,
      }),
    },
  });
});

app.all(
  "*",
  createRequestHandler({
    getLoadContext() {
      return { prisma };
    },
  })
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server started on http://localhost:${port}`);
});
