import { auth } from "@clerk/tanstack-react-start/server";
import { clerkClient } from "@clerk/tanstack-react-start/server";
import { getRequestHeader } from "@tanstack/react-start/server";
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

function hasClerkSecret(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY);
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const bytes = base64UrlToBytes(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function base64UrlToJson(value: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as Record<string, unknown>;
}

function readClerkPublishableKey(): string | undefined {
  return process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
}

function getClerkIssuer(): string | null {
  const publishableKey = readClerkPublishableKey();
  if (!publishableKey) return null;
  const match = publishableKey.match(/^pk_(?:test|live)_(.+)$/);
  if (!match) return null;
  const decoded = new TextDecoder().decode(base64UrlToBytes(match[1])).replace(/\$$/, "");
  return decoded.startsWith("http") ? decoded : `https://${decoded}`;
}

let jwksCache: { issuer: string; keys: JsonWebKey[]; expiresAt: number } | undefined;

async function getClerkJwks(issuer: string): Promise<JsonWebKey[]> {
  if (jwksCache?.issuer === issuer && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }
  const response = await fetch(`${issuer}/.well-known/jwks.json`);
  if (!response.ok) throw new Error("Unable to load authentication keys");
  const body = (await response.json()) as { keys?: JsonWebKey[] };
  const keys = body.keys ?? [];
  jwksCache = { issuer, keys, expiresAt: Date.now() + 10 * 60 * 1000 };
  return keys;
}

async function verifyBearerToken(token: string): Promise<Record<string, unknown>> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error("Invalid auth token");

  const header = base64UrlToJson(encodedHeader);
  const payload = base64UrlToJson(encodedPayload);
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Invalid auth token");

  const issuer = getClerkIssuer();
  if (!issuer) throw new Error("Authentication is not configured");
  if (payload.iss !== issuer) throw new Error("Invalid auth issuer");

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now - 60) throw new Error("Auth token expired");
  if (typeof payload.nbf === "number" && payload.nbf > now + 60) throw new Error("Auth token not active");

  const jwk = (await getClerkJwks(issuer)).find(
    (key) => (key as JsonWebKey & { kid?: string }).kid === header.kid,
  );
  if (!jwk) throw new Error("Authentication key not found");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToArrayBuffer(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!verified) throw new Error("Invalid auth signature");
  return payload;
}

function claimListHasValue(claim: unknown, value: string): boolean {
  if (typeof claim !== "string" || !claim) return false;
  return claim.split(",").some((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf(":");
    return (separator === -1 ? trimmed : trimmed.slice(separator + 1)) === value;
  });
}

type MinimalClerkSession = {
  userId: string;
  sessionClaims: Record<string, unknown>;
  has: (params: { plan?: string }) => boolean;
};

async function getOptionalClerkSession(): Promise<MinimalClerkSession | null> {
  try {
    const session = await auth();
    if (session.userId) {
      const sessionClaims = ("sessionClaims" in session && session.sessionClaims
        ? session.sessionClaims
        : {}) as Record<string, unknown>;
      return {
        userId: session.userId,
        sessionClaims,
        has: (params) => {
          if (!params.plan || typeof session.has !== "function") return false;
          const hasPlan = session.has as unknown as (value: { plan: string }) => boolean;
          return hasPlan({ plan: params.plan }) === true;
        },
      };
    }
  } catch (error) {
    console.warn("[auth] Clerk request middleware unavailable; verifying bearer token fallback.", error);
  }

  const authorization = getRequestHeader("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const claims = await verifyBearerToken(token);
  const userId = typeof claims.sub === "string" ? claims.sub : null;
  if (!userId) return null;
  return {
    userId,
    sessionClaims: claims,
    has: (params) => (params.plan ? claimListHasValue(claims.pla, params.plan) : false),
  };
}

async function resolveIdentity(clerkUserId: string, claims?: Record<string, unknown>): Promise<UserIdentity> {
  let email = normalizeEmail(readClaimString(claims, ["email", "primary_email_address", "email_address"]));
  let name = readClaimString(claims, ["name", "given_name", "preferred_username"]);

  if (hasClerkSecret()) {
    try {
      const user = await clerkClient().users.getUser(clerkUserId);
      email = normalizeEmail(user.emailAddresses?.[0]?.emailAddress) ?? email;
      name = user.firstName ?? user.username ?? name;
    } catch {
      // The Clerk session is still authoritative; profile enrichment is optional.
    }
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
  const session = await getOptionalClerkSession();
  if (!session?.userId) return null;
  return resolveIdentity(session.userId, session.sessionClaims);
}

export async function requireUnlimitedPlanForSlideCount(slideCount: number): Promise<void> {
  if (slideCount <= 12) return;
  const session = await getOptionalClerkSession();
  const ok = session?.has({ plan: "unlimited" }) === true;
  if (!ok) {
    throw new Error("PREMIUM_REQUIRED: Upgrade to the Unlimited plan to generate 12–15 slide decks.");
  }
}
