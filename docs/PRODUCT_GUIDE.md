# Nurturehouse School Hub — Product Guide

*A complete guide to the platform for product owners and stakeholders.*

**Version:** 1.0 · **Last updated:** 21 July 2026 · **Status:** Production

---

## 1. What is Nurturehouse School Hub?

Nurturehouse School Hub is a **multi-school management platform** — a single web application that runs the day-to-day operations of one or many schools: enrolment, students, classes, attendance, grading, reports, billing, notices, and parent communication.

It is built to serve **two very different kinds of school** from the same codebase:

| School type | Who it's for | What the experience emphasises |
|---|---|---|
| **Montessori** | Early-years / Montessori nurseries | Observations, curriculum progress, daily reports, photo activity feed, care logging (feeding, sleep, temperature) |
| **Regular** | Conventional primary/secondary schools | Classes & subjects, gradebook, ranked report cards, promotion, timetables, homework |

Each school gets its **own private space** (its own students, staff, parents, branding, and data). A parent at School A can never see School B's data. This separation is enforced at the database level, not just in the interface.

---

## 2. Who uses it — the four roles

The platform has four distinct user types. What a person sees is determined entirely by **who they are**, not by a URL — they log in once and land in the right place automatically.

### 🛡️ Super Admin (platform owner)
Runs the **whole platform**, across every school. This is the operator of Nurturehouse School Hub itself.
- Sees platform-wide totals (all schools, students, staff).
- **Approves or declines** new school registrations.
- Adds schools directly, edits a school's branding, suspends or reactivates schools, and sends a school a notification.

### 🏫 School Admin
Runs **one school**. The head/administrator of an individual school.
- Manages students, staff assignments, and enrolment.
- Handles billing, notices, the school calendar, kit/supply lists, and the resource library.
- Invites parents to the portal and reviews enrolment applications.

### 👩‍🏫 Teacher
Works with **their own classes/children**.
- **Montessori:** records observations, tracks curriculum progress, writes daily reports, posts to the activity feed, logs care (meals, sleep, temperature), takes attendance.
- **Regular:** enters marks in the gradebook, generates report cards, manages homework and the timetable, takes the register.

### 👪 Parent
Sees **only their own children**. Read-focused.
- Views daily reports/progress, report cards, attendance, notices, calendar, homework, and the resource library.
- Views and tracks invoices; manages child parameters (allergies, emergency contacts) and after-school care.

---

## 3. Core concept: how a school comes to life

The lifecycle from "a school wants to join" to "parents are logging in" is the backbone of the product.

```
  School registers  ──►  Pending approval  ──►  Super Admin approves  ──►  School is Active
   (self sign-up)         (locked out)           (one click)                (full access)
                                                                                  │
                                                                                  ▼
                                          Admin sets up classes/students  ──►  Admin invites parents
                                                                                  │
                                                                                  ▼
                                                            Parent gets email  ──►  Signs in with a code
```

**Every self-registered school must be approved before it can operate.** Until then, its admin can log in but only sees an "Awaiting approval" screen. This gives the platform owner control over who joins.

---

## 4. Key workflows (step-by-step guides)

### 4.1 Onboarding a new school
1. A school owner visits **Get Started** and registers their school (name, type, admin name & email).
2. The school is created with status **Pending**. The owner is signed in but sees an **"Awaiting approval"** gate.
3. The **Super Admin** sees the school under **"Awaiting approval"** on the Schools screen (and a banner + count on the overview).
4. Super Admin clicks **Approve** → the school becomes **Active** and the admin is emailed.
5. The admin signs back in and now has the full dashboard to set up their school.

> The Super Admin can also **Decline** a registration (marks it suspended) or **Add School** directly, which creates it already active.

### 4.2 Inviting a parent to the portal
1. School Admin opens **Portal Invites** and clicks **Invite Parent**.
2. Enters the parent's email, an optional name, and selects the child.
3. The platform creates the parent's account, links them to the child, and **emails them a sign-in link**.
4. The parent signs in with a **one-time code** (no password). Their status moves from *Invited* → *Active* once they first sign in.
5. The admin can **Resend** the invite or **Copy the portal link** at any time.

### 4.3 Signing in (passwordless)
1. A user enters their email on the **Login** screen.
2. The system emails them a **6-digit code** (delivered through the platform's own email service).
3. They enter the code and are taken straight to their role's home screen.

*No passwords to remember or reset. Codes expire after a few minutes.*

### 4.4 Enrolment applications (admissions)
1. A prospective family submits the **public enrolment form** for a school (no account needed).
2. The application lands in the school's **Applications** list; staff are notified by email and the applicant gets a confirmation.
3. The admin reviews and **Accepts** (creates the student record and triggers a parent invite + acceptance email) or **Rejects**.

### 4.5 Grading & report cards (Regular schools)
1. Teachers enter continuous-assessment and exam marks in the **Gradebook**.
2. The platform computes each student's totals, **grades**, and **class ranking** automatically (with correct handling of ties), plus class average and size.
3. The teacher/admin **publishes** the report card; parents are emailed and can view/print it.
4. In the third term, **promotion** status is calculated for the class.

### 4.6 The Montessori day
1. Teachers post to the **Activity Feed** (photos + captions), record **Observations** against curriculum areas, and update **Curriculum Progress**.
2. They write **Daily Reports** (care, work cycle, subject progress) and can **bulk-log** meals, sleep, and temperature for the class.
3. A **temperature at or above 38°C automatically triggers a fever alert email** to the child's parents.
4. Parents see it all in near-real-time in their portal.

### 4.7 Billing
1. Admin issues an **invoice** to a family; the parent is emailed.
2. Parents view invoices and receipts in their portal.
3. Admin marks invoices **paid** as payment is received.

---

## 5. Feature map by role

<details open>
<summary><b>Super Admin</b></summary>

- Platform **Overview** (totals across all schools, pending-approval alerts)
- **Schools** list with status, students, staff
- **School detail** — stats, branding, status controls, send notification
- **Add School**
</details>

<details open>
<summary><b>School Admin</b> (Montessori & Regular)</summary>

- **Overview** dashboard
- **Students** (profiles, medications, parameters)
- **Calendar**
- **Enrolment Applications** & **Acceptance Letters**
- **Kit / Supply Lists** (per programme or class)
- **Portal Invites**
- **Resource Library** (publish guides/videos/policies)
- **Billing**
- **Settings**
- *Montessori:* Class Assignments, After-School Care, Academic Reports
- *Regular:* Classes, Subjects, Timetable, Report Cards, Promotion
</details>

<details open>
<summary><b>Teacher</b></summary>

- *Montessori:* My Classroom, Attendance, Students, Activity Feed, Observations, Curriculum, Child Report, Bulk Logging, Media Gallery
- *Regular:* My Classes, Class Register, Gradebook, Report Cards, Timetable, Homework, Students
</details>

<details open>
<summary><b>Parent</b></summary>

- *Montessori:* Activity Feed, Notice Board, Calendar, Resource Library, Attendance, Daily Reports, Academic Progress, Invoices & Receipts, Child Parameters, After-School Care
- *Regular:* Notice Board, Calendar, Attendance, Report Cards, Subject Grades, Timetable, Homework, Invoices & Receipts
</details>

---

## 6. Notifications

The platform sends transactional emails at key moments. All are **best-effort** — if email is temporarily unavailable, the underlying action still succeeds and the event is logged.

| Notification | Sent to | Trigger |
|---|---|---|
| Sign-in code | Any user | Login request |
| Parent portal invite | Parent | Admin invites a family |
| Notice posted | All parents | Admin/super-admin posts a notice |
| Invoice issued | Parent | Admin issues an invoice |
| Homework assigned | Class parents | Teacher assigns homework |
| Absence alert | Parent | Child marked absent |
| **Fever alert** | Parent | Temperature ≥ 38°C logged |
| After-school confirm | Parent + staff | Enrol/unenrol in after-school |
| School status change | School admin | Super-admin approves/suspends |
| Application received | Applicant | Public enrolment form submitted |
| New application alert | School staff | Public enrolment form submitted |
| Application accepted | Parent | Admin accepts an application |
| Report card published | Parent | Teacher/admin publishes a report card |

---

## 7. How it's built (for context)

A high-level view of the technology — enough for planning and vendor conversations, without the internals.

- **Web application:** Next.js 16 (React 19), TypeScript, Tailwind CSS. Server-rendered for speed and SEO; interactive where it needs to be.
- **Database & accounts:** Supabase (managed PostgreSQL + authentication). ~35 tables covering every domain above.
- **Security — tenant isolation:** Every data request is filtered by **Row-Level Security** at the database. A user physically cannot read another school's rows, even if the interface were bypassed. Parents are further restricted to their own children.
- **Authentication:** Passwordless email one-time codes; a platform owner account bootstraps the system.
- **Email:** Resend (transactional email).
- **Image uploads:** Cloudinary (activity photos, media gallery).
- **Automatic ranking & stats:** Report-card ranking, curriculum statistics, and platform totals are computed in the database for accuracy and speed.

### Data ownership & privacy
- Each school's data is isolated by design.
- Parents see only their own children.
- Staff-only content (e.g. internal comments) is never exposed to parents.

---

## 8. Current status & roadmap

### ✅ Live today
- Full multi-school platform with both Montessori and Regular experiences
- All four roles, end-to-end, on a real database
- School self-registration + super-admin approval
- Passwordless sign-in and parent portal invitations
- Enrolment applications, grading & ranked report cards, Montessori observations/curriculum/daily reports
- Billing, notices, calendar, kit lists, resource library
- Transactional email for all events in §6
- Printable report cards & invoices (in-app)

### 🔜 Recommended next steps
| Item | Why it matters | Effort |
|---|---|---|
| **Verify a sending domain in Resend** | *Required* for emails to reach parents/staff at scale. Today only the platform owner's own address is guaranteed delivery. | Config only |
| Calendar-event reminders | Automated reminders before events | Needs a scheduled job |
| Two-way parent ↔ teacher messaging | Direct communication | New feature |
| PDF email attachments | Attach report cards/invoices to emails (currently in-app print) | Medium |

> **Action item for launch:** verifying a sending domain in Resend is the single most important pre-launch task — without it, invited parents may not receive their sign-in codes.

---

## 9. Setup & operations (for whoever runs it)

The platform is configured with a handful of settings (kept private, not in the code):

- **Supabase** — the database & auth project (URL + keys).
- **Resend** — the email service (API key + a verified sending domain).
- **Cloudinary** — image hosting (account credentials).
- **App URL** — the public web address.

**Bootstrapping the platform owner:** a single super-admin account is created via a provided script; that person then approves schools and manages the platform. Additional platform owners can be added the same way.

**Deployment:** the app is a standard Next.js application and can be hosted on any Next.js-compatible host (e.g. Netlify/Vercel), with the same settings mirrored into the hosting environment.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **Tenant / School** | An individual school with its own isolated data |
| **Super Admin** | The platform owner, operating across all schools |
| **Pending / Active / Suspended** | A school's status; only Active schools can operate |
| **RLS (Row-Level Security)** | Database rule that keeps each school's data private |
| **OTP** | One-time passcode used for passwordless login |
| **Montessori vs Regular** | The two school experiences the platform supports |
| **Curriculum progress** | A Montessori child's advancement through the prepared curriculum |
| **Report card ranking** | Automatic position of a student within their class |

---

*Prepared for the Nurturehouse School Hub product owner. For technical/architecture depth, see the codebase README and the `supabase/migrations` schema.*
