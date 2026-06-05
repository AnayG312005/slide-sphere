import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { getMyProfile } from "@/lib/profile.functions";
import { useHasUnlimited } from "@/lib/billing";
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

  const hasUnlimited = useHasUnlimited();
  const credits = data?.profile.credits;
  const low = credits !== undefined && credits < 5;

  return (
    <div className="inline-flex items-center gap-2">
      <Link
        to={hasUnlimited ? "/dashboard" : "/pricing"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
          hasUnlimited
            ? "bg-gradient-to-r from-amber-400 to-fuchsia-500 text-white shadow-glow"
            : "bg-secondary text-muted-foreground border hover:text-ink"
        }`}
        title={hasUnlimited ? "Unlimited plan" : "Upgrade to Unlimited"}
      >
        {hasUnlimited ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
        {hasUnlimited ? "Unlimited" : "Free"}
      </Link>
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
          low ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-secondary text-ink border-border"
        }`}
        title={`${credits ?? "…"} credits remaining`}
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="tabular-nums">{credits ?? "—"}</span>
        <span className="text-muted-foreground">credits</span>
      </div>
    </div>
  );
}
