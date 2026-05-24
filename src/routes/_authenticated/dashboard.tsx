import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/tanstack-react-start";
import { listProjects, deleteProject } from "@/lib/projects.functions";
import { PromptComposer } from "@/components/PromptComposer";
import { FileText, Trash2, Loader2, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Lumen" }] }),
});

function Dashboard() {
  const fetchProjects = useServerFn(listProjects);
  const del = useServerFn(deleteProject);
  const { user } = useUser();
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deck deleted"); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.05]">
          What should we <span className="italic text-gradient-ember">create</span> today?
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Describe your idea, attach a document, choose your length. Slide Sphere do the rest.
        </p>
      </div>

      <div className="mb-16">
        <PromptComposer onCreated={() => refetch()} />
      </div>

      {/* Projects */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Your decks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.projects.length ? `${data.projects.length} deck${data.projects.length === 1 ? "" : "s"}` : "Updates in real time"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-card border animate-pulse" />
          ))}
        </div>
      ) : !data?.projects.length ? (
        <div className="glass border rounded-3xl p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary grid place-items-center mb-5">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display text-2xl text-ink">No decks yet</h3>
          <p className="text-muted-foreground mt-2">Generate your first presentation above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.projects.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border bg-card p-5 hover:shadow-soft hover:-translate-y-0.5 transition cursor-pointer animate-fade-in"
              onClick={() => router.navigate({ to: "/editor/$id", params: { id: p.id } })}
            >
              <div className="aspect-video rounded-xl gradient-ember mb-4 p-4 flex flex-col justify-end shadow-glow">
                <div className="text-[10px] uppercase tracking-widest text-white/70">Deck</div>
                <div className="font-display text-white text-lg leading-tight line-clamp-2">{p.title}</div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm("Delete this deck?")) delMut.mutate(p.id); }}
                  className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                  aria-label="Delete deck"
                >
                  {delMut.isPending && delMut.variables === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
    <Footer />
    </>
  );
}
