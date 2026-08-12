// Shared route-level loading skeletons.
//
// Every route in this app is dynamically server-rendered, so each navigation
// waits on Supabase before painting. These render inside the role layout (the
// sidebar stays put) via the `loading.tsx` files in each route segment.
//
// Each root element carries role="status" + aria-busy so assistive tech
// announces the wait; the individual blocks are aria-hidden.

import { Skeleton } from "@/components/ui/skeleton";

function Header() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** Catch-all for a dashboard page: title, a stat row, and a few cards. */
export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-5xl space-y-6"
    >
      <Header />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** A table of records — the teacher-side report queues. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Header />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="space-y-px overflow-hidden rounded-2xl border border-slate-100 bg-white p-4">
        <Skeleton className="mb-3 h-4 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

/** A parent-facing archive: child switcher pills over a list of cards. */
export function ArchiveSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-3xl space-y-6"
    >
      <Header />
      <div className="flex gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * A full report document — mirrors ProgressReportDocument / DailyReportDocument
 * so the layout doesn't jump when the real thing arrives.
 */
export function ReportDocumentSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading report"
      className="mx-auto max-w-4xl pb-20"
    >
      {/* Chrome bar: back link + download/print */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-24 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
        {/* Header: avatar + fields, logo right */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-8 w-64 max-w-full" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-48 max-w-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-16 w-28 shrink-0" />
        </div>

        {/* Two content sections, each a heading + rule + rows */}
        {Array.from({ length: 2 }).map((_, section) => (
          <div key={section} className="mb-8">
            <Skeleton className="mb-1 h-6 w-40" />
            <div className="mb-3 border-t border-slate-200" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, row) => (
                <div key={row} className="flex items-baseline gap-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** The teacher's long editing form. */
export function ReportEditorSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading report"
      className="mx-auto max-w-4xl pb-24"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-32 rounded-md" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <Skeleton className="mb-2 h-5 w-44" />
            <Skeleton className="mb-4 h-4 w-72 max-w-full" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
