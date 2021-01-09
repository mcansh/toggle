import { Router } from "express";
import { convertFlagsArrayToObject } from "../utils";
import { prisma } from "../utils/prisma";

const api = Router();

api.use(async (_req, res, next) => {
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

api.get("/flags", async (_req, res) => {
  const flags = await prisma.flag.findMany({
    where: {
      teamId: "ckjnab6t20006raiszrzenw5t",
    },
  });

  const flagObject = convertFlagsArrayToObject(flags);

  return res.json({ flags: flagObject });
});

api.get("/channel/:channelId", async (req, res) => {
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

export { api };
