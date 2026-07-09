import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId, requireUserIdentity, type UserIdentity } from "./auth.server";
import { getSupabaseAdmin } from "./supabase-admin.server";
import { internalError } from "./safe-error";

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await requireUserIdentity();
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id,title,description,theme,status,updated_at,created_at")
    .in("clerk_user_id", identity.accountIds)
    .order("updated_at", { ascending: false });
  if (error) throw internalError("listProjects", error);
  const ids = (data ?? []).map((p) => p.id);
  let covers: Record<string, string | null> = {};
  if (ids.length > 0) {
    const { data: slideRows } = await supabaseAdmin
      .from("slides")
      .select("project_id,image_url,position")
      .in("project_id", ids)
      .eq("position", 0);
    covers = Object.fromEntries((slideRows ?? []).map((s) => [s.project_id, s.image_url ?? null]));
  }
  const projects = (data ?? []).map((p) => ({ ...p, cover_image_url: covers[p.id] ?? null }));
  return { projects };
});

export const getProject = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const identity = await requireUserIdentity();
    const supabaseAdmin = getSupabaseAdmin();
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .in("clerk_user_id", identity.accountIds)
      .maybeSingle();
    if (error) throw internalError("getProject", error);
    if (!project) throw new Error("Project not found");
    const { data: slides } = await supabaseAdmin
      .from("slides")
      .select("*")
      .eq("project_id", data.id)
      .order("position");
    return { project, slides: slides ?? [] };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const identity = await requireUserIdentity();
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", data.id)
      .in("clerk_user_id", identity.accountIds);
    if (error) throw internalError("deleteProject", error);
    return { ok: true };
  });

const SlidePatch = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).optional(),
  body: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional(),
  bullets: z.array(z.string().max(400)).max(20).optional(),
  image_url: z.string().url().nullable().optional(),
});

async function applySlidePatch(identity: UserIdentity, patch: z.infer<typeof SlidePatch>) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: slide } = await supabaseAdmin
    .from("slides").select("project_id").eq("id", patch.id).maybeSingle();
  if (!slide) throw new Error("Slide not found");
  const { data: project } = await supabaseAdmin
    .from("projects").select("clerk_user_id").eq("id", slide.project_id).maybeSingle();
  if (!project || !identity.accountIds.includes(project.clerk_user_id)) throw new Error("Forbidden");

  const update: {
    title?: string;
    body?: string;
    notes?: string;
    bullets?: string[];
    image_url?: string | null;
  } = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.bullets !== undefined) update.bullets = patch.bullets;
  if (patch.image_url !== undefined) update.image_url = patch.image_url;
  if (Object.keys(update).length === 0) return slide.project_id;

  const { error } = await supabaseAdmin.from("slides").update(update).eq("id", patch.id);
  if (error) throw internalError("applySlidePatch", error);
  return slide.project_id;
}

export const updateSlide = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SlidePatch.parse(d))
  .handler(async ({ data }) => {
    const identity = await requireUserIdentity();
    await applySlidePatch(identity, data);
    return { ok: true };
  });

export const updateSlidesBulk = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ slides: z.array(SlidePatch).min(1).max(50) }).parse(d)
  )
  .handler(async ({ data }) => {
    const identity = await requireUserIdentity();
    const supabaseAdmin = getSupabaseAdmin();
    const projectIds = new Set<string>();
    for (const p of data.slides) {
      const pid = await applySlidePatch(identity, p);
      projectIds.add(pid);
    }
    // Touch parent project(s) so updated_at reflects edit time on dashboard.
    for (const pid of projectIds) {
      await supabaseAdmin.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", pid);
    }
    return { ok: true, count: data.slides.length };
  });
