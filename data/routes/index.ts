import { Loader, redirect } from "@remix-run/data";

export let loader: Loader = async ({ session }) => {
  const userId = session.get("userId");

  if (!userId) return redirect("/login");

  return {};
};
