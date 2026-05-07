# Information Architecture: Role Separation (Admin / Teacher / Parent)

## Site Map

Public surfaces (Inter + Playfair):

- Home `/`
- Apply `/enrollment`
- Sign in `/login` — role picker for demo (Admin / Teacher / Parent)
- Public invoice view `/invoice/[id]` — token-gated link parents land on from email

Authenticated surfaces (Inter Tight, scoped per role):

- Admin `/dashboard` — operations cockpit
  - Overview `/dashboard`
  - Students `/dashboard/students`
    - Student profile `/dashboard/students/[id]`
  - Calendar `/dashboard/calendar`
  - Applications `/dashboard/enrollment`
  - Acceptance Letters `/dashboard/letters`
  - Kit Lists `/dashboard/kits`
  - Portal Invites `/dashboard/invites`
  - Academic Reports `/dashboard/reports`
  - Billing `/dashboard/accounting`
  - Settings `/dashboard/settings`
- Teacher `/teacher` — single classroom view
  - My Classroom `/teacher`
  - Attendance `/teacher/attendance`
  - Bulk Logging `/teacher/log`
  - Media Gallery `/teacher/gallery`
  - Observation `/teacher/observations/[studentId]`
- Parent `/parent` — child-centric feed
  - Activity Feed `/parent`
  - Notice Board `/parent/notices`
  - Resource Library `/parent/resources`

## Navigation Model

Three layouts, one per role, sharing a primitive shell pattern but distinct
in nav, density, and tone.

**Admin (`/dashboard/*`)** — desktop-first, dense, sectioned sidebar.
Sections: Workspace · Admissions · Operations · Settings.

**Teacher (`/teacher/*`)** — tablet/desktop, classroom-scoped sidebar.
Sections: Today · Classroom · Documentation. No cross-classroom views.

**Parent (`/parent/*`)** — mobile-first, app-like bottom-tab bar on small
screens, slim sidebar on desktop. Always anchored to one child at a time
(child switcher in the header for multi-child parents).

Utility (all roles): a top header with notifications, a search field
(admin/teacher), the active user, and a "Switch role (demo)" affordance
that returns to `/login` for demo purposes.

## Content Hierarchy

### Admin Overview (`/dashboard`)
1. Operations metrics (enrolled, staff, pending apps, waitlist)
2. Recent applications table — admit/waitlist actions
3. Quick actions (post notice, send acceptance letters, distribute kits)
4. New-feature callout

### Teacher Home (`/teacher`)
1. Greeting + classroom + today's date
2. Status cards (present count, observation drafts, action items)
3. Classroom roster grid — tap a student to log/observe
4. Today's schedule

### Parent Home (`/parent`)
1. Child header + check-in status
2. Daily metric snapshot (meals, nap, hygiene)
3. Activity feed — photos, milestones, notes (chronological)
4. Quick action: message teacher

## User Flows

### Demo entry (the "full flow" path)
1. Visitor lands on `/login` → sees three role buttons.
2. Click "Continue as Admin" → cookie `demo_role=admin` is set → land on `/dashboard`.
3. Click "Continue as Teacher" → `demo_role=teacher` → land on `/teacher`.
4. Click "Continue as Parent" → `demo_role=parent` → land on `/parent`.
5. Each layout renders the persona's name/email in the header.
6. A "Switch role" link in each header returns to `/login`.

### Cross-role consistency (the demo storyline)
The same student — **Zoe Wong**, Primary B, parent Amanda Wong, teacher Ms. Sarah Reed — appears in all three views with the same data:

1. **Admin** issues a November tuition invoice for Zoe (`/dashboard/accounting`).
2. **Parent** Amanda sees the same invoice in her billing list and on her dashboard reminder card.
3. **Teacher** Ms. Sarah logs an observation on Zoe's Pink Tower work (`/teacher/observations/zoe`).
4. **Parent** Amanda sees that observation appear in Zoe's activity feed within seconds.
5. **Admin** posts a school-wide notice ("Winter showcase Dec 12"). **Parent** sees it on her notice board.

Mock data must be sourced from one shared layer so these consistency points hold.

### Admin → Parent: notice broadcast
1. Admin opens `/dashboard` → "Post to Notice Board" quick action.
2. Fills in notice (title, body, audience: All Parents).
3. Submits → notice persists to mock store.
4. Parent at `/parent/notices` sees it as the newest entry.

### Teacher → Parent: observation
1. Teacher opens `/teacher/observations/[studentId]`.
2. Logs an observation (text + tag).
3. Submits → appended to that student's observation list.
4. Parent of that student sees it in `/parent`'s activity feed.

### Admin → Parent: invoice
1. Admin issues invoice via `/dashboard/accounting` → Create Invoice.
2. Invoice persists with parent ID + student ID.
3. Parent at `/parent` sees a reminder; clicking opens `/invoice/[id]`.

## Naming Conventions

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| Authenticated person | "User" in code, persona name in UI | Admin User / Ms. Sarah Reed / Amanda Wong |
| Admin's home | "Overview" | Avoid "dashboard" as a label since all three roles have one |
| Teacher's home | "My Classroom" | Possessive — emphasizes singular scope |
| Parent's home | "Activity Feed" | Stream-oriented; not a "dashboard" |
| Student record | "Student" everywhere | Not "child", not "kid", not "pupil" |
| Application record | "Application" | Not "enrollment" — a noun for the artifact, not the process |
| Invoice (unpaid) | "Invoice" | Becomes "Receipt" only after payment |
| Observation note | "Observation" | Pedagogical Montessori term — keep |

## Component Reuse Map

| Component | Used on | Behavior differences |
|-----------|---------|---------------------|
| `RoleShell` (sidebar + header layout primitive) | All three role layouts | Each role passes its own nav config and header utilities |
| `SidebarNav` | All role layouts | Different `NAV_SECTIONS` per role |
| Mock data layer (`src/lib/mock/*`) | All views | Single source — selectors filter by role |
| `Card`, `Button`, `Badge`, `Dialog`, `Table` (shadcn) | All views | Reused as-is |
| `useDemoSession()` hook | All layouts | Reads/sets `demo_role` cookie for the three personas |

## Content Growth Plan

- **Mock store** stays in-memory (module-scoped state) for the demo. When real
  data arrives, replace `src/lib/mock/*` with Supabase queries — call sites
  keep their existing selector signatures.
- **Notices, observations, invoices** are growing collections — paginated
  in the future, hardcoded short lists for now.
- **Per-classroom views** scale by adding a classroom switcher for teachers
  with multiple classes (out of scope for v1 demo).

## URL Strategy

- Admin lives at `/dashboard/*` (kept for URL stability).
- Teacher at `/teacher/*`, Parent at `/parent/*`.
- Route groups (`(admin)`, `(teacher)`, `(parent)`) provide per-role layouts
  without changing URLs.
- Dynamic segments for resource ids (`/dashboard/students/[id]`,
  `/teacher/observations/[studentId]`, `/invoice/[id]`).
- No query parameters in v1; future filtering on `?status=` / `?class=`.
