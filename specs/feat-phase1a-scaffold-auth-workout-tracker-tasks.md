# Task Breakdown: Phase 1a — Scaffold, Auth & Workout Tracker

**Generated:** 2026-03-26
**Source:** `specs/feat-phase1a-scaffold-auth-workout-tracker.md`

## Overview

Build the HyperRep gym tracking app from scratch: Next.js 16+ scaffold, Supabase auth, 8-table database with RLS, Black & Electric Blue theme, weekly dashboard, workout page with per-set logging, session timer, rest timer, and settings page.

## Dependency Graph

```
T1 (Scaffold) ──┬──→ T2 (Theme) ──→ T5 (UI Components)
                 │
                 ├──→ T3 (Supabase Clients) ──→ T4 (Auth Middleware) ──→ T6 (Auth Pages)
                 │
                 └──→ T7 (DB Migration SQL)

T5 + T6 + T7 ──→ T8 (Exercise Seed + Program Data)
                      │
                      ├──→ T9 (Dashboard Page)
                      │
                      └──→ T10 (Workout Page) ──→ T11 (Session & Rest Timer)
                                                       │
T9 + T11 ──→ T12 (Settings Page) ──→ T13 (App Shell Layout) ──→ T14 (GitHub Repo + Push)
```

## Phase 1: Foundation

### Task 1: Scaffold Next.js Project
**Size:** Small | **Priority:** High | **Dependencies:** None

### Task 2: Theme System (Tailwind v4 + CSS Variables + next-themes)
**Size:** Medium | **Priority:** High | **Dependencies:** T1

### Task 3: Supabase Client Utilities
**Size:** Small | **Priority:** High | **Dependencies:** T1

### Task 4: Auth Middleware
**Size:** Small | **Priority:** High | **Dependencies:** T3

### Task 5: UI Primitive Components
**Size:** Small | **Priority:** Medium | **Dependencies:** T2

## Phase 2: Auth & Database

### Task 6: Auth Pages (Login + Signup)
**Size:** Medium | **Priority:** High | **Dependencies:** T3, T4, T5

### Task 7: Database Migration SQL
**Size:** Medium | **Priority:** High | **Dependencies:** T1

## Phase 3: Data Seeding

### Task 8: Exercise Library + Program Seed Data
**Size:** Large | **Priority:** High | **Dependencies:** T7

## Phase 4: Core Features

### Task 9: Dashboard Page
**Size:** Large | **Priority:** High | **Dependencies:** T5, T6, T8

### Task 10: Workout Page + Server Actions
**Size:** Large | **Priority:** High | **Dependencies:** T5, T6, T8

### Task 11: Session Timer + Rest Timer
**Size:** Medium | **Priority:** High | **Dependencies:** T10

## Phase 5: Polish & Ship

### Task 12: Settings Page + Weight Logging
**Size:** Medium | **Priority:** Medium | **Dependencies:** T6, T5

### Task 13: App Shell Layout (Header + Nav)
**Size:** Medium | **Priority:** High | **Dependencies:** T9, T12

### Task 14: GitHub Repo + Push
**Size:** Small | **Priority:** Medium | **Dependencies:** All

## Execution Strategy

**Critical path:** T1 → T2 → T3 → T4 → T6 → T8 → T10 → T11 → T13 → T14

**Parallel opportunities:**
- T2 (Theme) and T3 (Supabase) can run in parallel after T1
- T7 (Migration SQL) can run in parallel with T2-T5
- T9 (Dashboard) and T10 (Workout) can run in parallel after T8
- T12 (Settings) can run in parallel with T10/T11

**Total tasks:** 14
**Phase breakdown:** Foundation (5) → Auth & DB (2) → Seeding (1) → Core Features (3) → Polish (3)
