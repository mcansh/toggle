import path from "path";

import express from "express";
import session from "express-session";
import { createRequestHandler } from "@remix-run/express";
import Redis from "ioredis";
import redisConnect from "connect-redis";
import rateLimit from "express-rate-limit";
import RateLimitRedis from "rate-limit-redis";
import dotenv from "dotenv-safe";
import { PrismaClient } from "@prisma/client";

import { FlagType } from "@prisma/client";

function parseFeatureValue(type: FlagType, value: string) {
  return type === "Boolean"
    ? JSON.parse(value)
    : type === "Int"
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  store: new RateLimitRedis({ client }),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
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
      maxAge: 60 * 60 * 60 * 24 * 15, // 15 days
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

app.all("/api/flags", async (req, res) => {
  const authToken = req.headers.authorization ?? "ckjlug9m80000nqist5jrjbk9";
  // if (!authToken) return res.status(401).json({});
  const flags = await prisma.flag.findMany({
    where: {
      Team: { members: { some: { id: authToken } } },
    },
  });

  const parsedFlags = flags.map((flag) => ({
    ...flag,
    value: parseFeatureValue(flag.type, flag.value),
  }));

  return res.json({ flags: parsedFlags });
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
