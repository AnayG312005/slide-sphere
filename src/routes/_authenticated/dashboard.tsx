import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listProjects, deleteProject } from "@/lib/projects.functions";
import { Plus, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Lumen" }] }),
});

function Dashboard() {
  const fetchProjects = useServerFn(listProjects);
  const del = useServerFn(deleteProject);
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deck deleted"); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-ink">Your decks</h1>
          <p className="text-muted-foreground mt-1">Pick up where you left off, or start something new.</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New deck
        </Link>
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
          <h2 className="font-display text-2xl text-ink">No decks yet</h2>
          <p className="text-muted-foreground mt-2">Generate your first presentation in seconds.</p>
          <Link
            to="/new"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow"
          >
            <Plus className="w-4 h-4" /> Create your first deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.projects.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border bg-card p-5 hover:shadow-soft transition cursor-pointer"
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
  );
}
