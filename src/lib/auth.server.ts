import { auth } from "@clerk/tanstack-react-start/server";
import { clerkClient } from "@clerk/tanstack-react-start/server";
import { getSupabaseAdmin } from "./supabase-admin.server";

export type UserIdentity = {
  clerkUserId: string;
  accountId: string;
  accountIds: string[];
  email: string | null;
  name: string | null;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}

function readClaimString(claims: unknown, keys: string[]): string | null {
  if (!claims || typeof claims !== "object") return null;
  const record = claims as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

async function resolveIdentity(clerkUserId: string): Promise<UserIdentity> {
  const session = await auth();
  const claims = "sessionClaims" in session ? session.sessionClaims : undefined;
  let email = normalizeEmail(readClaimString(claims, ["email", "primary_email_address", "email_address"]));
  let name = readClaimString(claims, ["name", "given_name", "preferred_username"]);

  try {
    const user = await clerkClient().users.getUser(clerkUserId);
    email = normalizeEmail(user.emailAddresses?.[0]?.emailAddress) ?? email;
    name = user.firstName ?? user.username ?? name;
  } catch {
    // The Clerk session is still authoritative; profile enrichment is optional.
  }

  const accountIds = new Set<string>([clerkUserId]);
  let accountId = clerkUserId;

  if (email) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("clerk_user_id,created_at")
        .ilike("email", email)
        .order("created_at", { ascending: true });

      for (const row of data ?? []) {
        if (row.clerk_user_id) accountIds.add(row.clerk_user_id);
      }
      accountId = data?.[0]?.clerk_user_id ?? clerkUserId;
    } catch {
      accountId = clerkUserId;
    }
  }

  accountIds.add(accountId);
  return { clerkUserId, accountId, accountIds: Array.from(accountIds), email, name };
}

export async function requireUserId(): Promise<string> {
  const identity = await getOptionalUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity.accountId;
}

export async function getOptionalUserId(): Promise<string | null> {
  const identity = await getOptionalUserIdentity();
  return identity?.accountId ?? null;
}

export async function requireUserIdentity(): Promise<UserIdentity> {
  const identity = await getOptionalUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export async function getOptionalUserIdentity(): Promise<UserIdentity | null> {
  const session = await auth();
  if (!session.userId) return null;
  return resolveIdentity(session.userId);
}
