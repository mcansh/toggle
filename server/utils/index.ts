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

export { parseFeatureValue, convertFlagsArrayToObject };
