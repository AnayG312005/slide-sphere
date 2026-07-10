import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getOptionalUserIdentity, requireUserId, requireUserIdentity } from "./auth.server";
import { getSupabaseAdmin } from "./supabase-admin.server";

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getOptionalUserIdentity();
  if (!identity) {
    return {
      profile: { credits: 0, plan: "basic", totalEarned: 0, totalSpent: 0 },
      authenticated: false as const,
    };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existingProfiles, error: existingErr } = await supabaseAdmin
      .from("profiles")
      .select("credits,plan,total_earned,total_spent")
      .in("clerk_user_id", identity.accountIds)
      .order("created_at", { ascending: true })
      .limit(1);
    if (existingErr) throw new Error(existingErr.message);

    let profile = existingProfiles?.[0];
    if (!profile) {
      if (!identity.email) {
        throw new Error("Verified email is required before creating a workspace profile.");
      }
      const { data, error } = await supabaseAdmin.rpc("ensure_profile", {
        _clerk_user_id: identity.accountId,
        _email: identity.email,
        _name: identity.name ?? "",
      });
      if (error) throw new Error(error.message);
      profile = Array.isArray(data) ? data[0] : data;
    }
    return {
      profile: {
        credits: profile.credits as number,
        plan: profile.plan as string,
        totalEarned: profile.total_earned as number,
        totalSpent: profile.total_spent as number,
      },
      authenticated: true as const,
    };
  } catch (err) {
    console.error("getMyProfile failed:", err);
    return {
      profile: { credits: 0, plan: "basic", totalEarned: 0, totalSpent: 0 },
      authenticated: true as const,
    };
  }
});

export const getCreditHistory = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await requireUserIdentity();
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("credit_transactions")
    .select("id,delta,reason,created_at,project_id")
    .in("clerk_user_id", identity.accountIds)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[getCreditHistory]", error);
    throw new Error("Operation failed. Please try again.");
  }
  return { transactions: data ?? [] };
});

// Premium upgrades are handled via Clerk Billing entitlements (see
// `useHasUnlimited` and the server-side `has({ plan: "unlimited" })` check).
// This RPC previously granted 500 credits without any payment verification,
// which allowed any signed-in user to bypass billing. It is now disabled;
// re-enable only behind a verified Stripe/Clerk webhook that records the
// redeemed session id to prevent replay.
export const claimPremium = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId?: string }) => z.object({ sessionId: z.string().optional() }).parse(d))
  .handler(async () => {
    await requireUserId();
    throw new Error("This endpoint is disabled. Please upgrade via the pricing page.");
  });

