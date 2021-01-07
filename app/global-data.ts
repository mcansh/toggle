import type { Loader } from "@remix-run/data";

export let loader: Loader = async ({ session }) => {
  const flash = session.get("flash");
  const userId = session.get("userId");

  return {
    date: new Date(),
    flash,
    userId,
  };
};
