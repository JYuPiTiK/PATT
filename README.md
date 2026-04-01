# PATT — Project & Task Tracker

A full-stack project operations tool built with Next.js 15, featuring AI-powered meeting intake, Kanban boards, and cross-project work item management.

## Features

- **Projects** — colour-coded projects with team members, versions, and per-project views
- **Work Items** — tasks, bugs, features, enquiries, notes, follow-ups, and decisions with full lifecycle tracking (status, priority, assignee, due date, comments, activity log)
- **Kanban Board** — drag-and-drop board with grouping by status, type, or version (`@dnd-kit`)
- **List View** — filterable table view per project
- **AI Meeting Intake** — paste raw meeting notes → GPT-4o-mini extracts structured work items via function calling → approval queue before items enter the workflow
- **Approval Queue** — review AI-extracted items per-item or in bulk before they become work items
- **Global Search** — cross-entity search across work items, meetings, and projects
- **Workspace Settings** — manage workflow statuses shared across all projects
- **Loading skeletons** on every page, error boundaries, and 404 handling

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Database | PostgreSQL 16 via Prisma 6 ORM |
| Auth | NextAuth v5 beta (credentials + JWT) |
| UI | shadcn/ui (Radix UI primitives) + Tailwind CSS v4 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| AI | OpenAI `gpt-4o-mini` (function calling) |
| Forms | react-hook-form + zod |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.local.example .env.local
```

**.env.local** values needed:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/patt_db"
NEXTAUTH_SECRET="your-secret-32-chars"
AUTH_SECRET="your-secret-32-chars"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="yourpassword"
OPENAI_API_KEY="sk-..."
```

```bash
# Run database migrations and seed the admin user
npx prisma migrate deploy
npx ts-node prisma/seed.ts

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the credentials set in `.env.local`.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app — sidebar + topnav layout
│   │   ├── dashboard/      # Overview with stat cards and overdue items
│   │   ├── projects/       # Project list + per-project board/list/meetings/settings
│   │   ├── items/          # Global work items list, /items/new quick-add
│   │   ├── meetings/       # Meeting log and detail pages
│   │   ├── approval-queue/ # AI extraction review
│   │   ├── search/         # Cross-entity full-text search
│   │   └── settings/       # Workspace status configuration
│   ├── (auth)/             # Login page
│   └── api/                # REST API routes (projects, work-items, meetings, etc.)
├── components/
│   ├── board/              # Kanban board (DnD, columns, cards, grouped views)
│   ├── layout/             # Sidebar, TopNav, ProjectNav
│   ├── meetings/           # MeetingIntakeForm (3-step AI flow)
│   ├── work-items/         # WorkItemForm, CommentThread, ActivityLog, EditPanel
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── ai-extraction.ts    # OpenAI function calling for meeting note parsing
│   ├── auth.ts             # NextAuth config
│   └── prisma.ts           # Prisma client singleton
└── prisma/
    ├── schema.prisma       # Full data model
    ├── migrations/         # Migration history
    └── seed.ts             # Admin user seed
```

## AI Meeting Flow

1. Paste raw meeting notes into the intake form (`/meetings/new`)
2. GPT-4o-mini extracts structured items (type, priority, assignee, due date, tags, type-specific metadata)
3. Review the extracted items — toggle which ones to include
4. Approved items enter the approval queue; once approved they become live work items

## Data Model Highlights

- **WorkItem** — 7 item types with type-specific JSONB metadata (bug repro steps, feature business goal, enquiry contact info)
- **Meeting** — stores raw notes, AI summary, key decisions, open questions as JSON arrays
- **WorkspaceStatus** — shared across all projects, configurable order and default
- **Version** — per-project release tracking with optional release date
- **ActivityLog** — immutable audit trail on every work item field change
- **Comment** — threaded comments with internal/client-visible toggle
