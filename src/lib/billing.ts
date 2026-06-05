import { useAuth } from "@clerk/tanstack-react-start";

/**
 * Returns true when the signed-in user has the Clerk Billing "unlimited" plan.
 * The plan slug must match the plan configured in the Clerk dashboard.
 */
export function useHasUnlimited(): boolean {
  const { has, isSignedIn } = useAuth();
  if (!isSignedIn || typeof has !== "function") return false;
  try {
    return has({ plan: "unlimited" }) === true;
  } catch {
    return false;
  }
}
