import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getOptionalUserId } from "./auth.server";
import { requireUserId } from "./auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { clerkClient } from "@clerk/tanstack-react-start/server";

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getOptionalUserId();
  if (!userId) {
    return {
      profile: { credits: 0, plan: "basic", totalEarned: 0, totalSpent: 0 },
      authenticated: false as const,
    };
  }
  let email: string | null = null;
  let name: string | null = null;
  try {
    const user = await clerkClient().users.getUser(userId);
    email = user.emailAddresses?.[0]?.emailAddress ?? null;
    name = user.firstName ?? user.username ?? null;
  } catch {
    // Non-fatal — proceed with nulls
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("ensure_profile", {
      _clerk_user_id: userId,
      _email: email ?? "",
      _name: name ?? "",
    });
    if (error) throw new Error(error.message);
    const profile = Array.isArray(data) ? data[0] : data;
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
  const userId = await requireUserId();
  const { data, error } = await supabaseAdmin
    .from("credit_transactions")
    .select("id,delta,reason,created_at,project_id")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return { transactions: data ?? [] };
});

// For demo Stripe-less premium upgrade — wired to Stripe checkout later
export const claimPremium = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId?: string }) => z.object({ sessionId: z.string().optional() }).parse(d))
  .handler(async () => {
    const userId = await requireUserId();
    const { data, error } = await supabaseAdmin.rpc("add_credits", {
      _clerk_user_id: userId,
      _amount: 500,
      _reason: "premium_purchase",
      _metadata: { source: "stripe" },
    });
    if (error) throw new Error(error.message);
    return { credits: data as number };
  });
