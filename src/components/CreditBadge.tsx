import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getMyProfile } from "@/lib/profile.functions";
import { Sparkles, Crown } from "lucide-react";

export function CreditBadge() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const credits = data?.profile.credits;
  const plan = data?.profile.plan;
  const low = credits !== undefined && credits < 5;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
        low ? "bg-destructive/10 text-destructive border-destructive/30"
            : "bg-secondary text-ink border-border"
      }`}
      title={`${credits ?? "…"} credits remaining`}
    >
      {plan === "premium" ? (
        <Crown className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      )}
      <span className="tabular-nums">{credits ?? "—"}</span>
      <span className="text-muted-foreground">credits</span>
    </div>
  );
}
