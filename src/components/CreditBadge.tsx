import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Crown } from "lucide-react";

export function CreditBadge() {
  const fetchProfile = useServerFn(getMyProfile);
  const { user } = useUser();
  const { data, refetch } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refetch]);

  const credits = data?.profile.credits;
  const plan = data?.profile.plan;
  const low = credits !== undefined && credits < 5;

  return (
    <Link
      to="/billing"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
        low ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
            : "bg-secondary text-ink border-border hover:bg-accent"
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
    </Link>
  );
}
