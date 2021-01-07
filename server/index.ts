import path from "path";

import express from "express";
import session from "express-session";
import { createRequestHandler } from "@remix-run/express";
import Redis from "ioredis";
import redisConnect from "connect-redis";
import rateLimit from "express-rate-limit";
import RateLimitRedis from "rate-limit-redis";
import dotenv from "dotenv-safe";
import { Flag, PrismaClient } from "@prisma/client";
import ms from "ms";

function parseFeatureValue(type: string, value: string) {
  return type === "boolean"
    ? JSON.parse(value)
    : type === "number"
    ? Number(value)
    : value;
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

const limiter = rateLimit({
  windowMs: ms("15m"),
  max: 100, // limit each IP to 100 requests per windowMs
  store: new RateLimitRedis({ client }),
});

const testLimiter = rateLimit({
  windowMs: ms("15m"),
  max: 5, // limit each IP to 100 requests per windowMs
  store: new RateLimitRedis({ client }),
});

const registerLimiter = rateLimit({
  windowMs: ms("1h"),
  max: 5,
  store: new RateLimitRedis({ client }),
  message: `Too many accounts created from this IP, please try again after an hour`,
});

const app = express();

app.use(express.static("public"));

app.use(
  session({
    secret: "r3mixR0x",
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
    },
  })
);

app.use((request, response, next) => {
  if (request.method === "POST") {
    if (request.url === "/register") {
      return registerLimiter(request, response, next);
    }
    return limiter(request, response, next);
  }
  return next();
});

const prisma = new PrismaClient();

app.get("/api/flags", testLimiter, async (_req, res) => {
  const websiteFlags = await prisma.featureChannel.findUnique({
    where: {
      id: "ckjndxrkg0021m7iso0db33ml",
    },
    select: {
      flags: true,
    },
  });

  const websiteFlagsObject =
    websiteFlags?.flags.reduce((acc: { [key: string]: any }, cur: Flag) => {
      return {
        ...acc,
        [cur.feature]: parseFeatureValue(cur.type, cur.value),
      };
    }, {}) ?? {};

  if (websiteFlagsObject.EnablePublicAPI !== true) {
    return res.status(415).send({
      message: "our api isn't quite ready for you yet",
    });
  }

  const flags = await prisma.flag.findMany({
    where: {
      teamId: "ckjnab6t20006raiszrzenw5t",
    },
  });

  const flagObject = flags.reduce((acc: { [key: string]: Flag }, cur: Flag) => {
    return {
      ...acc,
      [cur.feature]: parseFeatureValue(cur.type, cur.value),
    };
  }, {});

  return res.json({ flags: flagObject });
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
