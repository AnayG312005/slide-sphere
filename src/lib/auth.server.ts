import { auth } from "@clerk/tanstack-react-start/server";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session.userId;
}

export async function getOptionalUserId(): Promise<string | null> {
  const session = await auth();
  return session.userId ?? null;
}
