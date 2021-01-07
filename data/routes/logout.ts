import { Loader, redirect } from "@remix-run/data";

const loader: Loader = async ({ session }) => {
  await session.destroy();
  return redirect("/login");
};

export { loader };
