# Slide Sphere — AI-Powered Presentation Generation Platform

## Project Overview

Slide Sphere is a modern, AI-first web application that turns a single prompt
(or a source PDF / image) into a polished, fully editable slide deck in
seconds. It combines a generation pipeline, a live slide editor, a stock-image
search panel, an export engine and a credit-based billing system into one
seamless experience.

## Problem Statement

Building good presentations is disproportionately painful: hours lost to
layout, alignment, copywriting, image hunting and theme consistency. Existing
tools either generate generic, soulless decks or hand users a blank canvas
and walk away. Non-designers end up with decks that look amateurish, and
designers end up rebuilding the same title slide for the thousandth time.

## Solution

Slide Sphere uses large language models and image search to draft a coherent
narrative, write the copy, choose imagery and assemble each slide on a
tasteful theme — then drops the user straight into a live editor where every
element (titles, body, bullets, images, layouts) can be refined. New
generations cost credits; editing and saving an existing deck is free.

## Features

- **AI Presentation Generation** — Gemini-powered drafting of structure, copy and speaker notes.
- **Stock Image Selection** — search Pexels & Unsplash inline and pick from 5 results per query.
- **Full PPT Editing** — titles, bodies, bullets, images and layouts are all editable post-generation.
- **Template / Theme Selection** — curated themes with consistent typography and spacing.
- **Dashboard** — manage, rename, duplicate and delete all of your decks.
- **Export** — native `.pptx` export plus shareable live links.
- **Credit System** — credits charged only on new generation; editing is free.
- **Authentication** — Clerk-powered sign-in (email + Google) with secure sessions.
- **Collaboration-ready** — projects scoped per user, ready for multi-user expansion.

## Technology Stack

- **Framework**: TanStack Start v1 (React 19 + Vite 7, SSR/SSG, server functions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components, design tokens in `src/styles.css`
- **Runtime**: Cloudflare Workers (edge), `nodejs_compat` enabled
- **Auth**: Clerk (`@clerk/tanstack-react-start`)
- **Database / Storage**: Lovable Cloud (Supabase) — Postgres + Storage + RLS
- **AI**: Lovable AI Gateway (Gemini 2.5 family for text & image)
- **Image Search**: Pexels & Unsplash REST APIs
- **Export**: `pptxgenjs` for `.pptx` generation
- **State / Data**: TanStack Query + TanStack Router loaders

## Architecture Overview

```
Browser (React 19)
   │
   ├── TanStack Router (file-based routes in src/routes/)
   ├── TanStack Query (cache + suspense)
   └── Clerk client (auth)
        │
        ▼
TanStack Start server functions (src/lib/*.functions.ts)
   │
   ├── requireSupabaseAuth / Clerk session middleware
   ├── Lovable AI Gateway  (generation + images)
   ├── Pexels / Unsplash    (stock image search)
   └── Supabase Admin client (service role, server-only)
        │
        ▼
Lovable Cloud (Postgres + Storage)
   - profiles, projects, slides, credit_transactions
   - slide-images bucket (signed URLs)
   - Row Level Security on every public table
```

Server logic lives in `*.functions.ts` (RPC via `createServerFn`) and in
`src/routes/api/public/*` for webhooks. Service-role Supabase access is
isolated to `*.server.ts` files and never bundled into the client.

## Installation Guide

Prerequisites: **Bun** (or Node 20+), a Lovable Cloud project, and a Clerk
project.

```bash
git clone https://github.com/your-org/slide-sphere.git
cd slide-sphere
bun install
```

## Setup Instructions

1. Copy `.env.example` to `.env` and fill in the variables below.
2. Apply database migrations (handled automatically by Lovable Cloud, or run
   `supabase db push` for self-hosted Postgres).
3. Start the dev server:

   ```bash
   bun run dev
   ```

4. Open `http://localhost:8080`, sign up, and generate your first deck.

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | client | Lovable Cloud project URL |
| `SUPABASE_URL` | server | Same backend URL used by server functions |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Admin DB + storage access |
| `VITE_CLERK_PUBLISHABLE_KEY` | client | Clerk frontend |
| `CLERK_SECRET_KEY` | server | Clerk server SDK |
| `LOVABLE_API_KEY` | server | Lovable AI Gateway (text + image) |
| `PEXELS_API_KEY` | server | Stock image search |
| `UNSPLASH_ACCESS_KEY` | server | Stock image search |

For Vercel, configure the same backend and Clerk project values used by the
Lovable deployment. Server-only variables must be present in Vercel's runtime
environment so dashboard projects, profiles and credits resolve to the same
workspace.

## Usage Guide

1. **Sign up / sign in** from the landing page.
2. **Describe your topic** in the prompt composer (or upload a PDF/JPG) and
   choose a slide length.
3. **Review the outline** — reorder, rename or remove slides.
4. **Generate** — the deck is assembled on a chosen theme.
5. **Edit any slide** — click a title, body, bullet or image to refine it.
   Click an image to open the stock search panel and pick a replacement.
6. **Save** — updates the existing project (no credits charged).
7. **Export** — download as `.pptx` or share a live link from the dashboard.

## Future Enhancements

- Realtime multi-user collaboration with presence and comments
- Brand kits (logo, colors, fonts) applied across all decks
- Voice-to-deck generation
- AI-generated charts and diagrams from raw data
- Native Google Slides and Keynote sync
- Presenter mode with AI-coached speaker notes and timing
- Community-contributed theme marketplace

---

© Slide Sphere. 
