import type { Flag } from '.prisma/client';

function parseFeatureValue(
  type: string,
  value: string
): boolean | number | string {
  return type === 'boolean'
    ? JSON.parse(value)
    : type === 'number'
    ? Number(value)
    : value;
}

function convertFlagsArrayToObject(
  flags?: Array<Flag>,
  options: {
    includeExtraProperties: boolean;
  } = {
    includeExtraProperties: false,
  }
): { [feature: string]: Flag } {
  if (!flags) return {};

  if (options.includeExtraProperties) {
    return flags.reduce(
      (acc, cur) => ({
        ...acc,
        [cur.feature]: {
          ...cur,
          value: parseFeatureValue(cur.type, cur.value),
        },
      }),
      {}
    );
  }

  return flags.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.feature]: parseFeatureValue(cur.type, cur.value),
    }),
    {}
  );
}

export { parseFeatureValue, convertFlagsArrayToObject };
