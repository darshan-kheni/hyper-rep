---
name: Phase 1a Architecture Decisions
description: Key technical decisions for HyperRep Phase 1a scaffold and workout tracker
type: project
---

Decisions confirmed on 2026-03-26:

- **Next.js 16+** (latest) with App Router, TypeScript, Tailwind CSS v4 (CSS-first config)
- **Scaffold location:** `hyperrep/` subdirectory within the repo (not root)
- **Supabase:** User has existing project; use `@supabase/ssr` (not deprecated auth-helpers)
- **Mutations:** Server Actions preferred over API routes
- **RLS:** Denormalize `user_id` onto child tables for fast policies
- **Theme:** `next-themes` + CSS variables + Tailwind class strategy, dark default
- **Weight units:** Support both lbs (exercise weights) and kg (body weight), user-switchable
- **Hooks:** Install `claudekit-hooks` globally
- **No Vercel config** for now — local dev only
- **GitHub:** Create new repo and push
- **No commit yet** — scaffold first

**Why:** These decisions were made during the `/spec:ideate` workflow to align on implementation approach before writing code.

**How to apply:** Reference these when scaffolding the project and making implementation choices throughout Phase 1a.