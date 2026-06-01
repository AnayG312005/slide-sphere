import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "./auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id,title,description,theme,status,updated_at,created_at")
    .eq("clerk_user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
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
    const userId = await requireUserId();
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Response("Not found", { status: 404 });
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
    const userId = await requireUserId();
    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("clerk_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateSlide = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; title?: string; body?: string; notes?: string }) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().max(200).optional(),
      body: z.string().max(4000).optional(),
      notes: z.string().max(4000).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    // Verify ownership via project
    const { data: slide } = await supabaseAdmin
      .from("slides").select("project_id").eq("id", data.id).maybeSingle();
    if (!slide) throw new Response("Not found", { status: 404 });
    const { data: project } = await supabaseAdmin
      .from("projects").select("clerk_user_id").eq("id", slide.project_id).maybeSingle();
    if (!project || project.clerk_user_id !== userId) throw new Response("Forbidden", { status: 403 });

    const update: { title?: string; body?: string; notes?: string } = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.body !== undefined) update.body = data.body;
    if (data.notes !== undefined) update.notes = data.notes;
    const { error } = await supabaseAdmin.from("slides").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
