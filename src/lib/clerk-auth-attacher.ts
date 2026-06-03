import { getToken } from "@clerk/tanstack-react-start";
import { createMiddleware } from "@tanstack/react-start";

export const attachClerkAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = await getToken().catch(() => null);

    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);