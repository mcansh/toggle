import type { Loader } from "@remix-run/data";

export const loader: Loader = async ({ session, request }) => {
  const flash = session.get("flash");
  const userId = session.get("userId");

  const userAgent = request.headers.get("user-agent").toLowerCase();

  const disableFormAutoCompleteForFireFox = userAgent.includes("firefox");

  return {
    date: new Date(),
    flash,
    userId,
    disableFormAutoCompleteForFireFox,
  };
};
