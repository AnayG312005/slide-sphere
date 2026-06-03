# Full Edit Mode for the PPT Editor

## Audit of what already works (no changes needed)

- **No duplicate records on save.** The editor opens an existing project by id and `updateSlide` mutates the same row in place. `finalizeDeck` (which charges 5 credits) is only invoked from `PromptComposer` on initial generation — editing never re-enters it. So credit deduction logic is already correct: charged on create, not on edit.
- **Dashboard auto-syncs.** `listProjects` is refetched on window focus and every 30s; `saveMut.onSuccess` already invalidates `["projects"]`.
- **Editor route loads single source of truth** keyed by project id (no versioning table needed for the dashboard-freshness requirement).

So the "version control / dashboard duplication / credit on edit" sections of the brief are already satisfied — I'll verify but not rebuild them.

## What's actually missing — to build

### 1. Edit / Preview mode toggle in the secondary header
- Add an **Edit** button immediately left of **Preview** in `editor.$id.tsx`.
- New state `mode: "preview" | "edit"`. Default = `preview` (canvas is read-only, matches Preview button look).
- In `edit` mode: titles, body, bullets, and images become interactive (hover ring, click to edit / open panel).
- In `preview` mode: everything is static (current SlidePreview-like look).

### 2. Bullet point editing (currently bullets render but aren't editable)
- In `SlideCanvasEditable`, bullets become a list of editable inputs in edit mode.
- Per-bullet: edit text, delete (✕ on hover), reorder (↑/↓ buttons), and an "+ Add bullet" affordance below the list.
- Bullets become part of the per-slide `draft` state alongside title/body.

### 3. Image click → right-side AI image panel
- Hover image in edit mode: outline + cursor-pointer.
- Click → opens a sticky right sidebar (`w-80`, slide-in via framer-motion) with:
  - Large `<textarea>` for image prompt (prefilled from current image context / slide title)
  - Style picker (radio cards): Illustration, Photo Realistic, Abstract, 3D Render, Line Art
  - "Generate New Image" button → calls new server fn `regenerateSlideImage`
  - Live preview thumbnail of current image
- New server fn `regenerateSlideImage(slideId, prompt, style)` calls Lovable AI Gateway (`google/gemini-2.5-flash-image-preview` via `/v1/chat/completions` with `modalities:["image","text"]`), uploads result to Supabase Storage `slide-images/{userId}/{slideId}-{ts}.png` via `supabaseAdmin`, updates `slides.image_url` + `slides.image_source = "ai"`, returns new URL. Creates the `slide-images` storage bucket (public read) if not present.

### 4. Atomic bulk save (fixes silent data loss when switching slides)
- Today: `saveMut` only saves the currently active slide; switching to another slide before clicking Save loses the in-flight draft.
- New design: keep a `draftsBySlideId: Record<string, {title, body, bullets}>` map. Editing any slide updates the map without server calls. The Save button is enabled whenever the map differs from server data and writes **all dirty slides** in one mutation.
- New server fn `updateSlidesBulk(slides: Array<{id, title?, body?, bullets?}>)` — wraps existing `updateSlide` ownership check, applies in a single `Promise.all` (or a server-side `upsert` batch). All-or-nothing: if any row fails, the mutation throws and the local draft stays dirty so the user can retry. On success, invalidates `["project", id]` and `["projects"]`.

### 5. `updateSlide` schema extension
- Add `bullets?: string[]` and `image_url?: string | null` to the `updateSlide` zod schema and write path (used for image regeneration).

### 6. Download gate cleanup
- The current "save before download" gate becomes: `disabled when any draft is dirty`. After bulk save, all drafts clear and download enables.

## Technical Details

**Files to edit**
- `src/lib/projects.functions.ts` — extend `updateSlide` schema (bullets, image_url); add `updateSlidesBulk` server fn.
- `src/lib/images.functions.ts` *(new)* — `regenerateSlideImage` server fn (Lovable AI image gen + Supabase Storage upload + slide update).
- `src/routes/_authenticated/editor.$id.tsx` — add Edit button, `mode` state, `draftsBySlideId` map, bulk save, image click handler.
- `src/components/SlideCanvasEditable.tsx` *(extract from inline)* — bullets editor + image hover/click; takes `mode` and `onImageClick` props.
- `src/components/ImageRegenPanel.tsx` *(new)* — right-side panel.
- One migration: create public storage bucket `slide-images` (if missing) + RLS-equivalent policy (public read, service_role write only — uploads happen via `supabaseAdmin`).

**Out of scope (intentionally, to keep the change focused)**
- Tables, charts, smart art, icons, shapes — current decks don't include these data models. Reading the brief literally would mean inventing a whole shape/chart system. I'll keep editing limited to fields the AI actually generates (title/body/bullets/image), which matches the existing data model.
- A separate `versions` table. The brief asks that the dashboard always show the latest — the current design already does that with one mutable row per project. Adding a versions table would be a large schema change with no UI surface in the brief.
- Layout switcher (changing a slide's `layout` enum). Not requested in the user-facing list; skipping unless asked.

## Confirm before I build

1. **Image regeneration model.** Lovable AI Gateway's `google/gemini-2.5-flash-image-preview` is the standard option — uses your existing `LOVABLE_API_KEY`, no separate cost setup. OK to use this?
2. **Charts/tables/shapes** — confirm it's OK to skip these (they don't exist in your current slide data model).
3. **Edit credit** — confirmed already free (no change needed); flagging so we're aligned.

Reply "go" (or with answers) and I'll implement in one pass.
