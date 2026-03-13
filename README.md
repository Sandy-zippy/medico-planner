# Archonek — AI-Powered Construction Documents

> Design-ready construction documents for Canadian professionals. From room schedules to code compliance, generate professional concept packages for clinics, offices, restaurants, and commercial spaces.

**Live App:** [medico-planner.vercel.app](https://medico-planner.vercel.app/app)
**Status:** MVP (auth bypassed for demo access)

---

## What It Does

Archonek generates **complete construction document packages** from a simple project brief. Enter your clinic type, location, and square footage — get back a full concept package with:

- 2D floor plans with room layouts, walls, doors, and dimension annotations
- Interactive 3D isometric building visualization (Three.js)
- Room schedules with finish codes and equipment references
- Building code compliance checklists (NBC, OBC, BCBC by province)
- Equipment matrices, door schedules, plumbing legends
- Wall partition specifications with fire ratings
- Scope of work documents
- Cover sheets and drawing indices

Everything is generated deterministically from building code data + room templates, with optional AI enhancement via Claude API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5, React 19.2 |
| Styling | Tailwind CSS 4, shadcn/ui |
| 3D Rendering | Three.js 0.182, React Three Fiber, Drei |
| Database | Supabase (PostgreSQL + Storage) |
| AI (optional) | Claude API (@anthropic-ai/sdk 0.74.0) |
| Deployment | Vercel |

---

## Architecture

### 5-Phase Generation Pipeline

When a user clicks "Generate Concept Package", the system executes this pipeline:

```
Phase 1: AI Generation (Claude API)
   └─ Produces: room_program, adjacencies, compliance_checklist, risks, code_analysis

Phase 2: Deterministic Generators
   └─ Produces: room_schedule, equipment_schedule, finish_schedule,
      wall_types, door_schedule, plumbing_legend, scope_of_work, drawing_list

Phase 3: Floor Plan Layout Engine
   └─ Produces: 2D spatial geometry (rooms, walls, doors, dimensions)

Phase 4: 3D Scene + Ceiling Plan
   └─ Produces: isometric 3D visualization, reflected ceiling plan

Phase 5: Cover Sheet
   └─ Produces: project summary with drawing index and code references
```

**If `ANTHROPIC_API_KEY` is not set**, Phase 1 falls back to a mock engine that produces synthetic but realistic output. All other phases run deterministically regardless.

### Data Flow

```
Browser (project-detail.tsx)
  │
  ├─ POST /api/projects/[id]/generate    ← triggers generation
  │     └─ Creates generation record (status: pending)
  │     └─ Fires background pipeline (no await)
  │     └─ Returns immediately
  │
  ├─ GET /api/projects/[id]/generations/[genId]   ← polls every 2s
  │     └─ Returns { output_json, status, error_message }
  │
  └─ Renders output_json across 6 tabs:
       Plan | 3D | Finishes | Zones | Equipment | Dims
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (marketing)
│   ├── login/page.tsx              # Magic link auth (Supabase OTP)
│   ├── pricing/page.tsx            # 3-tier pricing page
│   ├── app/
│   │   ├── page.tsx                # Dashboard — lists all projects
│   │   ├── new/page.tsx            # New project form
│   │   ├── [id]/page.tsx           # Project detail — renders generations
│   │   ├── account/page.tsx        # Account settings
│   │   └── layout.tsx              # App shell with nav
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts            # POST: create project
│   │   │   └── [id]/
│   │   │       ├── generate/route.ts       # POST: trigger generation
│   │   │       └── generations/[genId]/route.ts  # GET: poll status
│   │   └── upload/route.ts         # POST: file upload to Supabase Storage
│   └── auth/callback/route.ts      # Magic link callback handler
│
├── components/
│   ├── project/
│   │   ├── project-detail.tsx      # Main project UI (tabs, generation, state)
│   │   ├── floor-plan-thumbnail.tsx # SVG thumbnail for dashboard cards
│   │   └── context-panels.tsx      # Sidebar panels (compliance, schedules)
│   ├── layout/
│   │   ├── app-nav.tsx             # Top navigation bar
│   │   └── logout-button.tsx       # Logout action
│   └── ui/                         # shadcn/ui primitives
│
├── lib/
│   ├── ai-engine.ts                # Pipeline orchestrator (entry point)
│   ├── mock-engine.ts              # Deterministic fallback generator
│   ├── floor-plan-engine.ts        # 2D spatial layout algorithm
│   ├── scene-3d-engine.ts          # Floor plan → 3D scene converter
│   ├── constants.ts                # Clinic types, building codes, occupancy calcs
│   ├── room-templates.ts           # Default room configurations per clinic type
│   ├── data/
│   │   ├── equipment-database.ts   # Equipment specs by clinic type
│   │   ├── finish-specs.ts         # Finish schedule (F1-F8)
│   │   ├── wall-types.ts           # Partition specifications (P1-P5)
│   │   └── drawing-templates.ts    # Drawing index templates
│   └── supabase/
│       ├── server.ts               # Server-side Supabase client (cookie-based)
│       ├── client.ts               # Browser-side Supabase client
│       ├── service.ts              # Service-role client (bypasses RLS)
│       └── middleware.ts           # Route handling (redirects, cookie cleanup)
│
├── types/index.ts                  # All TypeScript interfaces
└── middleware.ts                   # Next.js middleware entry point
```

---

## Key Files — What Each Does

### Generation Engine

| File | Purpose |
|------|---------|
| `lib/ai-engine.ts` | **Entry point.** Orchestrates the 5-phase pipeline. Calls Claude API or falls back to mock engine. |
| `lib/mock-engine.ts` | Deterministic generator for all schedules, compliance, and construction data. Works without API key. |
| `lib/floor-plan-engine.ts` | Double-loaded corridor algorithm. Takes room schedule + adjacencies → produces spatial geometry (rooms, walls, doors, dimensions). Corridor width: 5ft. |
| `lib/scene-3d-engine.ts` | Converts 2D floor plan (feet) to 3D scene (meters). Wall height: 2.7m. Generates isometric camera position. |
| `lib/constants.ts` | All building code data: 10 provinces, occupancy factors, fire ratings, exit requirements, clinic type definitions. |
| `lib/room-templates.ts` | Default room configurations for 16 clinic types with quantities and areas. |

### Floor Plan Engine Details

```
Constants:
  CORRIDOR_WIDTH = 5 ft
  EXT_WALL_THICK = 0.5 ft
  INT_WALL_THICK = 0.383 ft
  MIN_ROOM_WIDTH = 8 ft

Algorithm:
  1. Classify rooms into zones (public → clinical → support → staff → service)
  2. Compute building envelope from total area
  3. Place reception at front
  4. Sort remaining rooms by zone priority
  5. Pack into strips along corridor (left/right alternating)
  6. Generate wall segments with appropriate partition types (P1-P5)
  7. Place doors at room-corridor boundaries
  8. Add dimension annotations

Wall Selection Rules:
  P1 (0.333 ft) — Standard demising
  P2 — Acoustic partitions
  P3 — Clinical separations (fire-rated)
  P4 — Wet room separations (4hr fire rating)
  P5 (0.383 ft) — X-ray lead-lined (requires radiation physicist sign-off)
```

### 3D Scene Engine

```
Conversion: FT_TO_M = 0.3048
Wall Height: 2.7m
Floor Y-offset: 0.01m

Finish Color Map (F1-F8):
  F1: #F5F0E8 (Reception — beige)
  F2: #E8EDF2 (Clinical — blue-gray)
  F3: #E0E8E4 (Sterile — green-gray)
  F4: #E2E0E8 (Wet rooms — purple-gray)
  F5: #EDEBE4 (Staff — warm gray)
  F6: #EDE8E0 (Office — tan)
  F7: #E0E0E0 (Service — neutral gray)
  F8: #F0EDE8 (Consultation — cream)

Camera: Isometric, positioned diagonally from building centroid
```

---

## Supported Clinic Types (16)

| Type | Code | Full Schedules | Default Rooms |
|------|------|:-:|---|
| Dental Clinic | `dental` | Yes | Reception, 3x Operatory, Sterilization, X-Ray, Dr. Office, Staff, Washroom, Storage |
| Optometry Clinic | `optometry` | Yes | + Optical Dispensary, Contact Lens Room |
| Veterinary Clinic | `veterinary` | Yes | + Surgery Suite, Kennel/Recovery, Treatment Area |
| Physiotherapy Clinic | `physiotherapy` | Yes | + Open Gym/Exercise, Hydrotherapy Room |
| Medical Office | `medical_office` | Yes | + Nurse Station, Lab/Blood Draw |
| Pharmacy | `pharmacy` | Yes | + Compounding Room, Cold Storage, Consultation |
| Walk-in Clinic | `walk_in` | No | Similar to medical office |
| Urgent Care | `urgent_care` | No | + Triage Area, 3x Treatment Bays |
| Pediatrics | `pediatrics` | No | + Play Area, Parent Waiting |
| Psychiatry | `psychiatry` | No | + Secure Waiting, Observation Room |
| Chiropractic | `chiropractic` | No | + Adjustment Rooms, X-Ray |
| Dermatology | `dermatology` | No | + Procedure Room, Light Therapy |
| Rehabilitation | `rehabilitation` | No | + Therapy Pool, Gym |
| Occupational Therapy | `occupational_therapy` | No | + Activities Room, Assessment |
| Restaurant | `restaurant` | No | Kitchen, Dining, Bar, Storage |
| Tech Startup Office | `tech_office` | No | Open Plan, Meeting Rooms, Server Room |

**"Full Schedules"** = equipment matrix, finish schedule, wall types, door schedule, plumbing legend, and scope of work are generated. Types without full schedules still get room programs, compliance checklists, floor plans, and 3D views.

---

## Building Code Coverage

**10 Canadian Provinces:**

| Province | Code | Key Extras |
|----------|------|-----------|
| Ontario | OBC 2012 / NBC 2020 | AODA accessibility compliance |
| British Columbia | BCBC 2024 | BC Energy Step Code (Step 3 min) |
| Alberta | ABC 2019 | Standard NBC alignment |
| Quebec | NBC 2020 | — |
| Manitoba | MBC 2020 | — |
| Saskatchewan | SBC 2014 | — |
| Nova Scotia | NSBOCO 2012 | — |
| New Brunswick | MNBB 2015 | — |
| PEI | NBC 2020 | — |
| Newfoundland | NBC 2020 | — |

**Compliance data includes:** occupancy classification, fire ratings (floor/roof/corridor/suite), exit requirements, travel distances, washroom calculations, barrier-free requirements, sprinkler rules, and interior finish flame spread ratings.

---

## Database Schema

### `projects` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | TEXT | Owner (currently `'demo'` for guest access) |
| `clinic_type` | TEXT | One of 16 supported types |
| `province` | TEXT | 2-letter province code |
| `city` | TEXT | City name |
| `area_sqft` | INTEGER | Total project area |
| `budget_range` | TEXT | Budget tier |
| `timeline` | TEXT | Project timeline |
| `rooms_json` | JSONB | Custom room config `[{name, quantity, area_sqft}]` |
| `notes` | TEXT | Free-text notes |
| `upload_urls` | JSONB | Uploaded file URLs |
| `existing_space` | BOOLEAN | Tenant improvement vs. new construction |
| `address` | TEXT | Project address |
| `building_type` | TEXT | stand_alone / strip_mall / inside_mall / high_rise |
| `ceiling_type` | TEXT | tbar / drywall / mixed |
| `soundproof` | BOOLEAN | Enhanced acoustic requirements |
| `plumbing_fixtures` | JSONB | Custom plumbing requirements |
| `equipment_notes` | TEXT | Equipment notes |
| `status` | TEXT | draft / in_progress / completed |

### `generations` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `project_id` | UUID (FK) | References projects.id (CASCADE delete) |
| `version` | INTEGER | Incremental version number |
| `output_json` | JSONB | Full generation output (see OutputJSON type) |
| `status` | TEXT | pending / processing / completed / failed |
| `error_message` | TEXT | Error details if failed |

### SQL to Create Tables

```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'demo',
  clinic_type TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT DEFAULT '',
  area_sqft INTEGER NOT NULL,
  budget_range TEXT DEFAULT '',
  timeline TEXT DEFAULT '',
  rooms_json JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  upload_urls JSONB DEFAULT '[]',
  existing_space BOOLEAN DEFAULT TRUE,
  address TEXT DEFAULT '',
  building_type TEXT,
  ceiling_type TEXT DEFAULT 'tbar',
  soundproof BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  inspiration_urls JSONB DEFAULT '[]',
  plumbing_fixtures JSONB DEFAULT '{}',
  equipment_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  output_json JSONB,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for demo mode
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
```

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | No | Claude API key. If missing, mock engine is used. |

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/Sandy-zippy/medico-planner.git
cd medico-planner

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Fill in Supabase credentials (and optionally ANTHROPIC_API_KEY)

# 4. Create tables in Supabase
# Run the SQL above in your Supabase SQL Editor

# 5. Start dev server
npm run dev
# App runs at http://localhost:3000
```

---

## Deployment (Vercel)

The app is deployed at [medico-planner.vercel.app](https://medico-planner.vercel.app).

1. Connect the GitHub repo to Vercel
2. Set environment variables in Vercel project settings
3. Deploy — Vercel auto-detects Next.js

**Current state:** Auth is bypassed. All visitors access the dashboard as "Guest". The landing page at `/` redirects to `/app`. The login page exists at `/login` but is not enforced.

---

## Known Issues & Current State

| Issue | Status | Notes |
|-------|--------|-------|
| Auth bypassed | Intentional | Removed for demo access. Supabase auth (magic link OTP) is wired but disabled. |
| All projects visible to everyone | Intentional | RLS disabled, service client used. Re-enable when auth is restored. |
| Landing page unreachable | Intentional | `/` redirects to `/app`. Remove redirect in middleware to restore. |
| Supabase free tier pauses | Known | Project pauses after 7 days inactivity. Restore from Supabase dashboard. |
| Upload requires auth | Bug | Upload handler checks for user session, gets stuck in loading state without one. |
| CSS typo on pricing page | Bug | `-transtone-x-1/2` should be `-translate-x-1/2` (badge alignment). |
| 10 clinic types lack full schedules | Limitation | Only 6 types have equipment/finish/plumbing schedules. Others get floor plans and compliance only. |

---

## Re-enabling Authentication

To restore full auth:

1. **Middleware** (`src/lib/supabase/middleware.ts`): Add back `supabase.auth.getUser()` call and redirect `/app/*` to `/login` when no user
2. **App layout** (`src/app/app/layout.tsx`): Add back server-side auth check with `redirect("/login")`
3. **Dashboard** (`src/app/app/page.tsx`): Switch from `createServiceClient()` to `createClient()` with user-scoped queries
4. **Project detail** (`src/app/app/[id]/page.tsx`): Same — use auth client, add `user_id` filter
5. **Supabase**: Re-enable RLS on both tables, add policies for `auth.uid() = user_id`
6. **Remove** `export const dynamic = 'force-dynamic'` from dashboard if pages should be static again

---

## Output JSON Structure

Each generation produces an `output_json` with this structure:

```typescript
{
  summary: ProjectSummary,          // Clinic type, area, occupancy, code reference
  room_program: RoomProgramEntry[], // Room names, quantities, areas
  adjacencies: Adjacency[],        // Required/preferred/avoid room relationships
  compliance_checklist: ComplianceItem[], // Code compliance with status
  risks: RiskItem[],               // High/medium/low severity risks
  next_steps: string[],            // Recommended next actions
  code_analysis: CodeAnalysis,     // Occupancy, construction type, fire/sprinkler

  // Phase 2 (6 supported types only):
  room_schedule: RoomScheduleEntry[],
  detailed_code_analysis: DetailedCodeAnalysis,
  equipment_schedule: EquipmentItem[],
  finish_schedule: FinishScheduleEntry[],
  wall_types: WallType[],
  door_schedule: DoorScheduleEntry[],
  plumbing_legend: PlumbingFixture[],
  scope_of_work: string[],
  drawing_list: DrawingListEntry[],

  // Phase 3-5:
  floor_plan: FloorPlanGeometry,   // 2D layout with rooms, walls, doors, dims
  scene_3d: Scene3DData,           // 3D walls, floors, doors, labels, camera
  ceiling_plan: CeilingPlan,       // Reflected ceiling with lights, diffusers
  cover_sheet: CoverSheet,         // Project summary and drawing index
}
```

Full type definitions in `src/types/index.ts`.

---

## License

Private repository. All rights reserved.
