# PATT — Project & Task Tracker: Full Project Context

## What This App Is

PATT is a full-stack internal project operations tool for small teams. It replaces ad-hoc spreadsheets and Notion pages with a structured, AI-assisted workflow. The core loop is:

1. **Log a meeting** → paste raw notes → AI extracts structured work items
2. **Review in approval queue** → approve/reject items
3. **Work items flow into projects** → tracked on Kanban boards and list views
4. **Dashboard** gives at-a-glance status across all projects

## Branch

All code lives on: `claude/product-manager-app-feasibility-I4heq`

## Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Uses RSC, Server Actions, route groups |
| Database | PostgreSQL 16 + Prisma 6 | Schema at `prisma/schema.prisma` |
| Auth | NextAuth v5 beta | Credentials provider, JWT session, single admin user |
| UI | Radix UI primitives (hand-written, not CLI-installed) | Components in `src/components/ui/` |
| Styling | Tailwind CSS v4 | CSS variables for theming, no `tailwind.config.js` |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | Kanban board only |
| AI | OpenAI `gpt-4o-mini` | Function calling for structured extraction |
| Forms | react-hook-form + zod | |
| Notifications | sonner (Toaster) | |
| Date utils | date-fns | |

## Environment Variables (`.env.local`)

```
DATABASE_URL="postgresql://patt:patt_dev_password@localhost:5432/patt_db"
NEXTAUTH_SECRET="patt-dev-secret-change-in-production-32chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="patt-dev-secret-change-in-production-32chars"
ADMIN_EMAIL="admin@patt.local"
ADMIN_PASSWORD="admin123"
OPENAI_API_KEY="sk-proj-..."
```

**Important:** The AI extraction uses `OPENAI_API_KEY`, not `ANTHROPIC_API_KEY`.

## Key Conventions

### Next.js 15 Specifics (breaking changes from older versions)
- `searchParams` and `params` in page components are **Promises** — always `await` them
- Example: `const { id } = await params` not `params.id`
- Server components fetch data directly with Prisma — no API calls needed from RSC
- `"use client"` directive required for any component using hooks or browser APIs

### Prisma 6 Specifics
- Nullable JSON fields require `Prisma.DbNull` (not `null`) in `createMany`
- Date fields return `Date` objects — serialize to `.toISOString()` before passing to client components

### Tailwind CSS v4
- No `tailwind.config.js` — all config is in CSS via `@theme` in `src/app/globals.css`
- Use CSS variables: `bg-background`, `text-foreground`, `text-muted-foreground`, etc.
- Sidebar has its own token set: `bg-sidebar-background`, `text-sidebar-foreground`, etc.

### shadcn/ui Components (hand-written)
Available in `src/components/ui/`:
`avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `table`, `tabs`, `textarea`, `tooltip`

To add more: write them by hand following the Radix UI pattern. Do **not** run `npx shadcn add`.

## File Structure

```
src/
├── app/
│   ├── (app)/                          # Auth-protected layout (sidebar + topnav)
│   │   ├── layout.tsx                  # Checks session, renders Sidebar + TopNav
│   │   ├── error.tsx                   # Root error boundary (client component)
│   │   ├── not-found.tsx               # 404 for app routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Stat cards + overdue items + recent meetings
│   │   │   └── loading.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx                # Project grid with search
│   │   │   ├── loading.tsx
│   │   │   ├── ProjectSearch.tsx       # Debounced search → URL param
│   │   │   ├── new/page.tsx            # Create project form
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx          # Fetches project, renders ProjectNav tabs
│   │   │       ├── loading.tsx
│   │   │       ├── page.tsx            # Project overview (stats, team, versions)
│   │   │       ├── board/
│   │   │       │   ├── page.tsx        # Fetches approved items, renders BoardShell
│   │   │       │   └── loading.tsx
│   │   │       ├── list/
│   │   │       │   ├── page.tsx        # Serializes dates, renders WorkItemListClient
│   │   │       │   ├── WorkItemListClient.tsx  # Filterable table (client)
│   │   │       │   └── loading.tsx
│   │   │       ├── meetings/
│   │   │       │   ├── page.tsx        # Per-project meetings table
│   │   │       │   └── loading.tsx
│   │   │       ├── settings/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── loading.tsx
│   │   │       │   ├── ProjectEditForm.tsx
│   │   │       │   ├── TeamMembersSettings.tsx
│   │   │       │   └── VersionsSettings.tsx
│   │   │       └── work-items/
│   │   │           ├── new/page.tsx    # Create work item (project-scoped)
│   │   │           └── [itemId]/
│   │   │               ├── page.tsx    # Work item detail
│   │   │               └── loading.tsx
│   │   ├── items/                      # Global work items (cross-project)
│   │   │   ├── page.tsx                # Filterable table (type, priority, search)
│   │   │   ├── loading.tsx
│   │   │   ├── ItemsFilterBar.tsx      # Client filter controls
│   │   │   ├── new/page.tsx            # Project picker → redirects to project new item
│   │   │   └── [id]/page.tsx           # Redirect shim → /projects/[pid]/work-items/[id]
│   │   ├── meetings/
│   │   │   ├── page.tsx                # All meetings table
│   │   │   ├── loading.tsx
│   │   │   ├── new/page.tsx            # Meeting intake form
│   │   │   └── [meetingId]/
│   │   │       ├── page.tsx            # Meeting detail with AI summary + items
│   │   │       └── loading.tsx
│   │   ├── approval-queue/
│   │   │   ├── page.tsx                # Server component, serializes dates
│   │   │   ├── loading.tsx
│   │   │   └── ApprovalQueueClient.tsx # Per-item and bulk approve/reject
│   │   ├── search/
│   │   │   ├── page.tsx                # Cross-entity search (items, meetings, projects)
│   │   │   └── loading.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── statuses/
│   │           ├── page.tsx
│   │           └── StatusesSettings.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PATCH, DELETE
│   │   │       ├── work-items/route.ts # GET list with filters, POST create
│   │   │       ├── team-members/
│   │   │       │   ├── route.ts        # GET, POST
│   │   │       │   └── [memberId]/route.ts  # PATCH, DELETE (soft)
│   │   │       └── versions/
│   │   │           ├── route.ts        # GET, POST
│   │   │           └── [versionId]/route.ts # PATCH, DELETE (archive)
│   │   ├── work-items/
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PATCH, DELETE
│   │   │       └── comments/route.ts   # POST comment
│   │   ├── meetings/
│   │   │   ├── route.ts                # POST → runs AI extraction in transaction
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PATCH
│   │   │       └── approve/route.ts    # POST approve/reject items
│   │   ├── approval-queue/route.ts     # GET all pending meetings
│   │   └── workspace/
│   │       └── statuses/
│   │           ├── route.ts            # GET, POST
│   │           └── [statusId]/route.ts # PATCH
│   └── not-found.tsx                   # Root 404
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                 # Fixed sidebar nav (client, uses usePathname)
│   │   ├── TopNav.tsx                  # Search bar + user dropdown (client)
│   │   └── ProjectNav.tsx              # Project sub-tabs (client, active state)
│   ├── board/
│   │   ├── BoardShell.tsx              # Tab switcher: By Status / By Type / By Version
│   │   ├── KanbanBoard.tsx             # DndContext, optimistic updates, revert on fail
│   │   ├── KanbanColumn.tsx            # Droppable zone + SortableContext
│   │   ├── KanbanCard.tsx              # Draggable card
│   │   └── GroupedBoard.tsx            # Static grouped views (By Type, By Version)
│   ├── meetings/
│   │   └── MeetingIntakeForm.tsx       # 3-step: form → AI spinner → review/toggle items
│   ├── work-items/
│   │   ├── WorkItemForm.tsx            # Create form with type-specific conditional fields
│   │   ├── WorkItemEditPanel.tsx       # Right sidebar edit panel on detail page
│   │   ├── CommentThread.tsx           # Comment list + post form (internal toggle)
│   │   └── ActivityLog.tsx             # Immutable audit trail (fromValue/toValue)
│   └── ui/                             # shadcn/ui primitives (see list above)
├── lib/
│   ├── ai-extraction.ts                # OpenAI gpt-4o-mini function calling → ExtractionResult
│   ├── auth.ts                         # NextAuth v5 config
│   ├── prisma.ts                       # Prisma client singleton
│   └── utils.ts                        # cn() helper
└── prisma/
    ├── schema.prisma                   # Full schema
    ├── seed.ts                         # Seeds admin user + workspace statuses + sample projects
    └── migrations/                     # Migration history
```

## Data Model Summary

### WorkItem
- Types: `TASK | BUG | FEATURE | ENQUIRY | NOTE | FOLLOW_UP | DECISION`
- Priorities: `LOW | MEDIUM | HIGH | CRITICAL`
- Sources: `MANUAL | AI_EXTRACTED`
- Approval: `PENDING | APPROVED | REJECTED` (AI items start PENDING)
- Has: status (WorkspaceStatus), project, assignee (TeamMember), version, meeting (origin)
- JSONB `metadata` field: type-specific (bug repro steps, feature business goal, etc.)
- Related: Comments, ActivityLog, WorkItemEmbedding

### Meeting
- Types: `STANDUP | PLANNING | REVIEW | CLIENT_CALL | RETROSPECTIVE | AD_HOC | OTHER`
- Stores: `rawNotes`, `aiSummary`, `keyDecisions String[]`, `openQuestions String[]`
- Approval flows through its work items

### WorkspaceStatus
- Shared across all projects (not per-project)
- Has `order`, `color`, `isDefault`, `isArchived`
- Default statuses: Inbox → Pending Review → To Do → In Progress → Waiting on Internal → Waiting on Client → Blocked → Done → Archived

### Project
- Has: color, description, isArchived
- Related: WorkItems, TeamMembers, Versions, Meetings

### ActivityLog
- Fields: `field`, `fromValue`, `toValue` (not `newValue` — important)
- Created automatically when work item fields change via API

## AI Extraction Flow

1. User submits meeting notes via `MeetingIntakeForm`
2. `POST /api/meetings` → calls `extractWorkItemsFromNotes()` in `src/lib/ai-extraction.ts`
3. OpenAI `gpt-4o-mini` with forced function call `extract_work_items` returns structured JSON
4. Items saved as `WorkItem` records with `approvalStatus: PENDING`, `source: AI_EXTRACTED`
5. Meeting saved with AI summary, key decisions, open questions
6. User reviews in `/approval-queue` → approve/reject per item or bulk
7. Approved items become live work items visible on board/list

## Known Gotchas

1. **`params` and `searchParams` must be awaited** in Next.js 15 page components
2. **Prisma `DbNull`** required for nullable JSON fields in `createMany` (not plain `null`)
3. **Date serialization**: Prisma returns `Date` objects; pass `.toISOString()` to client components
4. **ActivityLog** uses `fromValue`/`toValue` fields (not `newValue`)
5. **`@anthropic-ai/sdk` is still in `package.json`** (installed but unused) — AI extraction uses `openai` package via `OPENAI_API_KEY`
6. **WorkspaceStatus** is shared across all projects — not per-project
7. **Soft deletes**: TeamMember uses `isActive: false`, Version uses `isArchived: true`, WorkItem uses `archivedAt DateTime?`

## Running Locally

```bash
# Prerequisites: PostgreSQL 16 running, patt user + patt_db database created
brew services start postgresql@16

# Setup
npm install
npx dotenv-cli -e .env.local -- npx prisma migrate deploy
npx dotenv-cli -e .env.local -- npx ts-node prisma/seed.ts
npm run dev
```

Login: `admin@patt.local` / `admin123`
