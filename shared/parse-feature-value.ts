import { FlagType } from "@prisma/client";

function parseFeatureValue(type: FlagType, value: string) {
  return type === "Boolean"
    ? JSON.parse(value)
    : type === "Int"
    ? Number(value)
    : value;
}

export { parseFeatureValue };
