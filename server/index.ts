import path from "path";

import express from "express";
import session from "express-session";
import { createRequestHandler } from "@remix-run/express";
import Redis from "ioredis";
import redisConnect from "connect-redis";
import rateLimit from "express-rate-limit";
import RateLimitRedis from "rate-limit-redis";
import dotenv from "dotenv-safe";

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
    saveUninitialized: true,
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
  console.log(request.method);

  if (request.method === "POST") {
    if (request.url === "/register") {
      return registerLimiter(request, response, next);
    }
    return limiter(request, response, next);
  }
  return next();
});

app.all(
  "*",
  createRequestHandler({
    getLoadContext() {},
  })
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server started on http://localhost:${port}`);
});
