# TalentOS — Human Potential Intelligence Platform

> **Identify the right person for the right opportunity — across any organization.**

TalentOS is a full-stack web application that understands people through their skills, performance history, activities, and trajectory, then uses a deterministic multi-factor scoring engine (with optional Gemini AI explanation) to surface the best-fit candidate for any task, role, or event.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Database Schema](#database-schema)
6. [Recommendation Algorithm](#recommendation-algorithm)
7. [Local Setup](#local-setup)
8. [API Reference](#api-reference)
9. [Demo Accounts](#demo-accounts)
10. [Project Roadmap](#project-roadmap)

---

## Problem Statement

Most HR, student management, and team tools store data but don't *reason* about it. When a coach needs a player for a tournament, a teacher needs a student for a competition, or a CEO needs the right engineer for a critical project — they rely on memory, gut-feel, or manual search.

TalentOS replaces that with **evidence-based intelligence**:
- It knows each person's *trajectory* (are they rising or plateauing?)
- It knows *why* someone is a fit — with cited evidence, not black-box scores
- It works for **any hierarchical organization**: schools, companies, sports academies, clubs

---

## Key Features

| Feature | Description |
|---|---|
| **Multi-organization support** | Schools, companies, sports academies — one platform, any org type |
| **Hierarchy management** | Recursive org tree with role-scoped access (HEAD → MANAGER → MEMBER) |
| **360° Profile** | Skills radar, performance trend line, activities, achievements |
| **Trajectory Engine** | OLS linear regression slope + CV-based consistency score per person |
| **Task-based Recommendations** | Define a task with weighted requirements; get ranked candidates with cited evidence |
| **Confidence Penalties** | Missing skill/performance data reduces scores — no false confidence |
| **NLP Query** | Plain-English queries parsed into structured requirements |
| **AI Explanation (Gemini)** | Grounded, zero-hallucination narrative explaining *why* a candidate fits |
| **Subtree RBAC** | Managers only see and act on people in their own branch |
| **Executive Analytics** | Surging talent, consistency leaders, dimension averages |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              React 18 Frontend               │
│  Vite · TypeScript · Tailwind CSS · Recharts │
│                                              │
│  Pages: Dashboard / Hierarchy / People /     │
│         Tasks (+ NLP bar) / Login            │
│  Components: ProfileModal (4-tab radar)      │
│              EvidenceDrawer · TaskModal      │
│              HierarchyTree (recursive)       │
└─────────────────┬───────────────────────────┘
                  │  /api  (Vite proxy → :5000)
┌─────────────────▼───────────────────────────┐
│           Express 5 + TypeScript             │
│                                              │
│  Auth middleware (JWT, requireRole)          │
│  Subtree RBAC (materialized path)            │
│                                              │
│  Route groups:                               │
│   /auth  /hierarchy  /profiles               │
│   /tasks  /analytics                         │
│                                              │
│  Services:                                   │
│   trajectory.service   (OLS + CV)            │
│   scoring.service      (weighted proximity)  │
│   nlpQuery.service     (keyword parser)      │
│   explanation.service  (Gemini + fallback)   │
└─────────────────┬───────────────────────────┘
                  │  Prisma ORM
┌─────────────────▼───────────────────────────┐
│           SQLite (dev.db)                    │
│   15 normalized models                       │
│   Materialized path hierarchy                │
│   Persisted recommendation runs              │
└─────────────────────────────────────────────┘
                  │  REST
┌─────────────────▼───────────────────────────┐
│  Google Gemini 1.5 Flash API (optional)      │
│  Grounded explanation generation             │
│  Falls back to deterministic template        │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, tree-shaking, modern JSX transform |
| Styling | Tailwind CSS v3 | Utility-first, zero runtime overhead |
| Charts | Recharts | Declarative radar + line charts, React-native |
| Backend | Node.js + Express 5 | Lightweight, async-first, mature ecosystem |
| Language | TypeScript (strict) | End-to-end type safety, shared DTOs |
| ORM | Prisma v5 | Type-safe queries, schema migrations, SQLite/Postgres portable |
| Database | SQLite (dev) | Zero-config local dev; swap to Postgres for production |
| Auth | JWT + bcrypt | Stateless, scalable; bcrypt for password hashing |
| AI | Gemini 1.5 Flash | Low-latency, cost-efficient, grounded generation |

---

## Database Schema

```
Organization ─── HierarchyNode ─┬── User
                                 └── (children nodes, recursive)

User ──── Profile ─┬── SkillRecord ──── Skill
                   ├── PerformanceRecord
                   ├── Activity
                   └── Achievement

Organization ──── CapabilityDimension   (org-specific scoring axes)
Organization ──── Task ─┬── TaskRequirement
                         └── RecommendationRun ─┬── RecommendationCandidate
                                                 └── RecommendationEvidence
```

**Key design decisions:**
- `HierarchyNode.path` stores a materialized path string (e.g. `/orgId/rootId/teamId`) for O(1) subtree scoping — no recursive CTE needed
- `SkillRecord` has a unique constraint on `(profileId, skillId)` → upsert semantics, no duplicates
- `RecommendationRun` persists every scoring run for auditability and trend analysis
- `CapabilityDimension` is per-org, allowing each organization to define its own axes (e.g. "Academic Performance" for schools, "Delivery Velocity" for companies)

---

## Recommendation Algorithm

### Step 1 — Candidate Pool
All `MEMBER` profiles in the requesting user's org subtree.

### Step 2 — Per-candidate Scoring

```
baseScore = Σ ( requirementWeight[i] × proximityScore[i] ) / Σ requirementWeight[i]
```

**Proximity score per requirement:**
- `SKILL`: `(personScore / targetScore) × 100`, capped at 100
- `PERFORMANCE`: `(avgScore / targetScore) × 100` across matching category records
- `EXPERIENCE`: `(activityCount / targetCount) × 100`, capped at 100

**Modifiers:**

| Modifier | Condition | Effect |
|---|---|---|
| Trajectory bonus | OLS slope ≥ 2.0 | +5% |
| Consistency bonus | CV-consistency ≥ 90% AND ≥ 2 samples | +3% |
| Missing data penalty | Any required dimension has no data | ×0.85 per gap |

### Step 3 — OLS Trajectory (per person)

Given n performance records sorted by date:

```
slope = ( n·Σ(t·y) − Σt·Σy ) / ( n·Σt² − (Σt)² )
```

Where `t` is the ordinal index (0, 1, 2…) and `y` is the score. A positive slope means the person is improving.

**Consistency (CV-inverse):**
```
CV = (stdDev / mean) × 100
consistency = max(0, 100 − CV)
```

### Step 4 — Final Score
```
suitabilityScore = min(100, baseScore × confidenceMultiplier × (1 + momentumBonus))
```

### Step 5 — AI Explanation (Gemini)
The top candidate's evidence citations (skill scores, performance history, missing data notes) are sent to Gemini 1.5 Flash with a strict prompt: *"Base your explanation ONLY on the following verified facts."* If no API key is set or the call fails, a deterministic template explanation is used — **no hallucination possible in either path.**

---

## Local Setup

### Prerequisites
- Node.js ≥ 18 (v20 LTS recommended)
- Git

### 1. Clone
```bash
git clone <repo-url>
cd project1
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET to any long random string
# Optionally set GEMINI_API_KEY for AI explanations

npm install
npx prisma db push        # creates dev.db with all tables
npm run seed              # populates demo organizations + profiles
npm run dev               # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:3000
```

Open **http://localhost:3000** and use any demo account below.

### 4. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `file:./dev.db` for SQLite |
| `JWT_SECRET` | ✅ | Any long random string |
| `PORT` | ❌ | Default `5000` |
| `NODE_ENV` | ❌ | `development` or `production` |
| `GEMINI_API_KEY` | ❌ | Enables AI explanations (falls back gracefully) |

### 5. npm Scripts

| Script | Command | Description |
|---|---|---|
| `dev:backend` | `cd backend && npm run dev` | Start backend with ts-node-dev HMR |
| `dev:frontend` | `cd frontend && npm run dev` | Start Vite dev server |
| `seed` | `cd backend && npm run seed` | Re-seed the database |
| `test:phase2` | `cd backend && npx ts-node test-phase2.ts` | Auth + hierarchy + profile tests |
| `test:phase3` | `cd backend && npx ts-node test-phase3.ts` | Recommendation accuracy tests |
| `test:edgecases` | `cd backend && npx ts-node test-edgecases.ts` | Edge-case hardening tests |
| `build:frontend` | `cd frontend && npm run build` | Production bundle |

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create org + admin account |
| POST | `/api/auth/login` | — | Get JWT token |
| GET | `/api/auth/me` | ✅ | Current user info |
| GET | `/api/auth/demo-accounts` | — | List all seeded demo accounts |

### Hierarchy
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/hierarchy` | ✅ | Full org tree (subtree-scoped) |
| POST | `/api/hierarchy` | MANAGER+ | Create child node |
| PATCH | `/api/hierarchy/:id` | MANAGER+ | Rename node |
| DELETE | `/api/hierarchy/:id` | HEAD | Delete leaf node (safe guard) |

### Profiles
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profiles` | ✅ | List + search profiles (subtree-scoped) |
| GET | `/api/profiles/:id` | ✅ | 360° profile with radar data + trajectory |
| POST | `/api/profiles` | MANAGER+ | Create person |
| POST | `/api/profiles/:id/performance` | MANAGER+ | Add performance record |
| POST | `/api/profiles/:id/skills` | MANAGER+ | Add / update skill record |
| POST | `/api/profiles/:id/activities` | MANAGER+ | Log activity |
| POST | `/api/profiles/:id/achievements` | MANAGER+ | Add achievement |

### Tasks & Recommendations
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | ✅ | List tasks |
| GET | `/api/tasks/:id` | ✅ | Task detail |
| POST | `/api/tasks` | MANAGER+ | Create task with requirements |
| POST | `/api/tasks/:id/recommend` | MANAGER+ | Run recommendation engine |
| POST | `/api/tasks/nl-query` | MANAGER+ | Natural language recommendation query |

### Analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/overview` | MANAGER+ | Surging talent, consistency leaders, achievements |

---

## Demo Accounts

All passwords: **`password123`**

### Apex STEM Academy (School)
| Email | Role | Position |
|---|---|---|
| `principal@apex.edu` | HEAD | Principal |
| `teacher.sharma@apex.edu` | MANAGER | Class 11-A Teacher |
| `rahul.s@apex.edu` | MEMBER | Student (top performer) |
| `priya.p@apex.edu` | MEMBER | Student |
| `neha.g@apex.edu` | MEMBER | Student |
| `aman.v@apex.edu` | MEMBER | Student (surging talent, +9.2 slope) |

### CloudScale Technologies (Company)
| Email | Role | Position |
|---|---|---|
| `ceo@cloudscale.io` | HEAD | CEO |
| `lead.marcus@cloudscale.io` | MANAGER | Engineering Lead |

### Quick Demo Walkthrough
1. Login as `principal@apex.edu`
2. **Dashboard** — see surging talent (Aman Verma) and consistency leaders
3. **Hierarchy** — explore the Apex org tree
4. **People** — search for "Rahul", click to open 360° profile with radar chart
5. **Tasks** — select "Science Quiz Champion" → click "Find Best Match" → Rahul ranks #1 with evidence
6. **NLP Bar** — type "find a student good at public speaking" and press Enter
7. Switch persona to `teacher.sharma@apex.edu` — hierarchy is scoped to Class 11-A only

---

## Project Roadmap

### Phase 1 ✅ — Environment & Core Engine
Database schema (15 models), seed data, Git setup

### Phase 2 ✅ — Auth, Hierarchy, 360° Profiles
JWT auth, subtree RBAC, profile CRUD, trajectory calculator

### Phase 3 ✅ — Recommendation Engine + Analytics
Multi-factor weighted scoring, evidence citations, executive dashboard

### Phase 4 ✅ — React Frontend
Hierarchy tree, profile radar, task modal, evidence drawer

### Phase 5 ✅ — NLP + AI Explanation
Natural language query parser, Gemini 1.5 Flash grounded explanation, deterministic fallback

### Phase 6 ✅ — Edge-Case Hardening
8-scenario test suite: cross-org blocking, role guards, missing data penalties, upsert idempotency

### Future Roadmap

| Priority | Feature |
|---|---|
| High | Postgres migration + Docker Compose |
| High | File upload: certificates, report cards, CVs → Gemini extraction |
| High | Email notifications when matched to a task |
| Medium | Bulk CSV import for large organizations |
| Medium | Time-based cohort comparison (batch of 2023 vs 2024) |
| Medium | Webhook API for external LMS / HRMS integration |
| Low | Mobile app (React Native sharing the same API) |
| Low | White-label theming per organization |
| Low | Exportable PDF recommendation reports |

---

## License

MIT — built as a demonstration of Human Potential Intelligence architecture.
