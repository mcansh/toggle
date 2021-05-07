function safeParse<Data>(input: string): Data | undefined {
  let json;
  try {
    json = JSON.parse(input);
  } catch (error) {
    // do nothing
  }

  return json;
}

export { safeParse };
