import { getAuth } from "@clerk/tanstack-react-start/server";
import { getWebRequest } from "@tanstack/react-start/server";

export async function requireUserId(): Promise<string> {
  const request = getWebRequest();
  if (!request) throw new Error("No request");
  const auth = await getAuth(request);
  if (!auth.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return auth.userId;
}
