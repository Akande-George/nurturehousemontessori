"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  clearPresentation,
  getCurriculumStats,
  getRoleUser,
  getStudentById,
  getStudentCurriculumProgress,
  markPresentation,
  setPresentationDate,
  useDemoStore,
  type CurriculumStatus,
} from "@/lib/mock/demo-store";
import {
  CURRICULUM,
  type Activity,
  type Area,
  type Subcategory,
} from "@/lib/curriculum/curriculum";
import { useToast } from "@/hooks/use-toast";

type Filter = "all" | "in-progress" | "mastered" | "not-started";

const STATUS_LABEL: Record<CurriculumStatus, string> = {
  "not-started": "Not started",
  introduced: "Introduced",
  practicing: "Practicing",
  mastered: "Mastered",
};

const STATUS_TONE: Record<CurriculumStatus, string> = {
  "not-started": "bg-slate-100 text-slate-500 border-slate-200",
  introduced: "bg-sky-50 text-sky-700 border-sky-200",
  practicing: "bg-amber-50 text-amber-700 border-amber-200",
  mastered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const SLOT_LABEL = ["1st presentation", "2nd presentation", "3rd presentation"];

function statusFromDates(dates: (string | undefined)[]): CurriculumStatus {
  const filled = dates.filter(Boolean).length;
  if (filled === 0) return "not-started";
  if (filled === 1) return "introduced";
  if (filled === 2) return "practicing";
  return "mastered";
}

function formatShort(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentCurriculumPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  useDemoStore();
  const teacher = getRoleUser("teacher");
  const student = getStudentById(studentId);

  const [activeAreaId, setActiveAreaId] = useState(CURRICULUM[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>(() => {
    // Default: first subcategory of each area open
    const initial: Record<string, boolean> = {};
    for (const area of CURRICULUM) {
      area.subcategories.forEach((sub, idx) => {
        initial[sub.id] = idx === 0;
      });
    }
    return initial;
  });
  const [openActivities, setOpenActivities] = useState<Record<string, boolean>>(
    {},
  );
  const [editingSlot, setEditingSlot] = useState<{
    leafId: string;
    slot: number;
  } | null>(null);
  const { toast } = useToast();

  const stats = getCurriculumStats(studentId);
  const progress = getStudentCurriculumProgress(studentId);

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-slate-500">Student not found.</p>
        <Link
          href="/teacher/curriculum"
          className="text-montessori-primary text-sm font-medium mt-3 inline-block"
        >
          ← Back to curriculum
        </Link>
      </div>
    );
  }

  if (student.teacherId !== teacher.id) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-slate-500">You don't have access to this student.</p>
      </div>
    );
  }

  const activeArea =
    CURRICULUM.find((a) => a.id === activeAreaId) ?? CURRICULUM[0];

  // Search applies across all areas; if a query is active we surface
  // matching leaves under their own area for navigability.
  const trimmedSearch = search.trim().toLowerCase();

  const handleMarkToday = (leafId: string, leafName: string) => {
    markPresentation(studentId, leafId);
    toast({
      title: "Marked presented today",
      description: leafName,
    });
  };

  const handleClear = (leafId: string, slot: number) => {
    clearPresentation(studentId, leafId, slot);
    setEditingSlot(null);
  };

  const handleSetDate = (leafId: string, slot: number, date: string) => {
    if (!date) return;
    setPresentationDate(studentId, leafId, slot, date);
    setEditingSlot(null);
  };

  const overallPct =
    stats.overall.total === 0
      ? 0
      : Math.round(
          ((stats.overall.introduced +
            stats.overall.practicing +
            stats.overall.mastered) /
            stats.overall.total) *
            100,
        );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/curriculum"
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Back to curriculum index"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif text-slate-900 truncate">
            {student.name}
          </h1>
          <p className="text-sm text-slate-500">
            Record Book · {student.classroom}
          </p>
        </div>
        <Link
          href={`/teacher/observations/${student.id}`}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-montessori-primary hover:underline"
        >
          <BookOpen className="h-3.5 w-3.5" />
          View journal
        </Link>
      </div>

      {/* Overall progress card */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Overall progress
              </p>
              <p className="text-2xl font-serif text-slate-900 mt-1">
                {stats.overall.introduced +
                  stats.overall.practicing +
                  stats.overall.mastered}{" "}
                <span className="text-slate-400 text-base font-sans font-normal">
                  / {stats.overall.total} activities introduced
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.overall.mastered} mastered ·{" "}
                {stats.overall.practicing} practicing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-3xl font-bold text-montessori-primary">
                  {overallPct}%
                </p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Touched
                </p>
              </div>
              <div className="w-20 h-20 rounded-full bg-slate-50 grid place-items-center">
                <div
                  className="w-16 h-16 rounded-full grid place-items-center text-white text-sm font-bold"
                  style={{
                    background: `conic-gradient(rgb(12 92 76) ${overallPct}%, #e2e8f0 ${overallPct}%)`,
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-white grid place-items-center text-slate-700 text-sm font-bold">
                    {overallPct}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-area mini bars */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            {CURRICULUM.map((area) => {
              const s = stats.byArea[area.id];
              const pct =
                s.total === 0
                  ? 0
                  : Math.round(
                      ((s.introduced + s.practicing + s.mastered) / s.total) *
                        100,
                    );
              return (
                <button
                  key={area.id}
                  onClick={() => setActiveAreaId(area.id)}
                  className={`text-left rounded-lg p-2.5 border transition-all ${
                    activeAreaId === area.id
                      ? `${area.tone.border} ${area.tone.soft} shadow-sm`
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold truncate">
                    {area.name}
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {pct}
                    <span className="text-xs text-slate-400 font-normal">
                      %
                    </span>
                  </p>
                  <div className="h-1 mt-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${area.tone.accent} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Area tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {CURRICULUM.map((area) => (
            <button
              key={area.id}
              onClick={() => setActiveAreaId(area.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeAreaId === area.id
                  ? `bg-white shadow-sm ${area.tone.text}`
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities…"
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            ["all", "in-progress", "mastered", "not-started"] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "in-progress"
                  ? "In progress"
                  : f === "mastered"
                    ? "Mastered"
                    : "Not started"}
            </button>
          ))}
        </div>
      </div>

      {/* Area body */}
      <AreaBody
        area={activeArea}
        progress={progress}
        search={trimmedSearch}
        filter={filter}
        openSubs={openSubs}
        setOpenSubs={setOpenSubs}
        openActivities={openActivities}
        setOpenActivities={setOpenActivities}
        editingSlot={editingSlot}
        setEditingSlot={setEditingSlot}
        onMarkToday={handleMarkToday}
        onClear={handleClear}
        onSetDate={handleSetDate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function leafMatchesFilter(
  status: CurriculumStatus,
  filter: Filter,
): boolean {
  if (filter === "all") return true;
  if (filter === "mastered") return status === "mastered";
  if (filter === "not-started") return status === "not-started";
  // in-progress
  return status === "introduced" || status === "practicing";
}

type AreaBodyProps = {
  area: Area;
  progress: ReturnType<typeof getStudentCurriculumProgress>;
  search: string;
  filter: Filter;
  openSubs: Record<string, boolean>;
  setOpenSubs: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  openActivities: Record<string, boolean>;
  setOpenActivities: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  editingSlot: { leafId: string; slot: number } | null;
  setEditingSlot: (v: { leafId: string; slot: number } | null) => void;
  onMarkToday: (leafId: string, leafName: string) => void;
  onClear: (leafId: string, slot: number) => void;
  onSetDate: (leafId: string, slot: number, date: string) => void;
};

function AreaBody(props: AreaBodyProps) {
  const { area, search, filter, openSubs, setOpenSubs } = props;

  return (
    <div className="space-y-3">
      <div className={`rounded-lg p-3 ${area.tone.soft} border ${area.tone.border}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${area.tone.text}`}>
          {area.name}
        </p>
        <p className="text-sm text-slate-600 mt-1">{area.description}</p>
      </div>

      {area.subcategories.map((sub) => (
        <SubcategoryBlock
          key={sub.id}
          area={area}
          sub={sub}
          isOpen={openSubs[sub.id] ?? false}
          onToggle={() =>
            setOpenSubs((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
          }
          search={search}
          filter={filter}
          progress={props.progress}
          openActivities={props.openActivities}
          setOpenActivities={props.setOpenActivities}
          editingSlot={props.editingSlot}
          setEditingSlot={props.setEditingSlot}
          onMarkToday={props.onMarkToday}
          onClear={props.onClear}
          onSetDate={props.onSetDate}
        />
      ))}
    </div>
  );
}

type SubcategoryBlockProps = {
  area: Area;
  sub: Subcategory;
  isOpen: boolean;
  onToggle: () => void;
  search: string;
  filter: Filter;
  progress: ReturnType<typeof getStudentCurriculumProgress>;
  openActivities: Record<string, boolean>;
  setOpenActivities: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  editingSlot: { leafId: string; slot: number } | null;
  setEditingSlot: (v: { leafId: string; slot: number } | null) => void;
  onMarkToday: (leafId: string, leafName: string) => void;
  onClear: (leafId: string, slot: number) => void;
  onSetDate: (leafId: string, slot: number, date: string) => void;
};

function SubcategoryBlock(props: SubcategoryBlockProps) {
  const {
    area,
    sub,
    isOpen,
    onToggle,
    search,
    filter,
    progress,
  } = props;

  // Pre-compute leaf statuses and filter-visibility for subcategory aggregate
  const subStats = useMemo(() => {
    let introduced = 0;
    let total = 0;
    for (const act of sub.activities) {
      const leaves =
        act.variations.length === 0
          ? [{ id: act.id, name: act.name }]
          : act.variations;
      for (const leaf of leaves) {
        total += 1;
        const p = progress[leaf.id];
        const filled = p ? p.dates.filter(Boolean).length : 0;
        if (filled > 0) introduced += 1;
      }
    }
    return { introduced, total };
  }, [sub.activities, progress]);

  // Filter activities & leaves matching search/filter
  const filteredActivities = useMemo(() => {
    return sub.activities
      .map((act) => {
        const leaves =
          act.variations.length === 0
            ? [{ id: act.id, name: act.name }]
            : act.variations;
        const visibleLeaves = leaves.filter((leaf) => {
          const haystack = `${act.name} ${leaf.name}`.toLowerCase();
          const matchesSearch = search === "" || haystack.includes(search);
          const p = progress[leaf.id];
          const status: CurriculumStatus = p
            ? statusFromDates(p.dates)
            : "not-started";
          const matchesFilter = leafMatchesFilter(status, filter);
          return matchesSearch && matchesFilter;
        });
        return { activity: act, leaves: visibleLeaves };
      })
      .filter((g) => g.leaves.length > 0);
  }, [sub.activities, search, filter, progress]);

  const isExpanded = search.length > 0 ? true : isOpen;
  const showWhenSearching = search === "" || filteredActivities.length > 0;

  if (!showWhenSearching) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <p className="text-sm font-semibold text-slate-900 truncate">
            {sub.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span>
            <span className="font-semibold text-slate-700">
              {subStats.introduced}
            </span>{" "}
            / {subStats.total}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${area.tone.accent}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {filteredActivities.map(({ activity, leaves }) => (
            <ActivityGroup
              key={activity.id}
              area={area}
              activity={activity}
              visibleLeaves={leaves}
              progress={progress}
              openActivities={props.openActivities}
              setOpenActivities={props.setOpenActivities}
              editingSlot={props.editingSlot}
              setEditingSlot={props.setEditingSlot}
              onMarkToday={props.onMarkToday}
              onClear={props.onClear}
              onSetDate={props.onSetDate}
              forceExpand={search.length > 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ActivityGroupProps = {
  area: Area;
  activity: Activity;
  visibleLeaves: { id: string; name: string }[];
  progress: ReturnType<typeof getStudentCurriculumProgress>;
  openActivities: Record<string, boolean>;
  setOpenActivities: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  editingSlot: { leafId: string; slot: number } | null;
  setEditingSlot: (v: { leafId: string; slot: number } | null) => void;
  onMarkToday: (leafId: string, leafName: string) => void;
  onClear: (leafId: string, slot: number) => void;
  onSetDate: (leafId: string, slot: number, date: string) => void;
  forceExpand: boolean;
};

function ActivityGroup(props: ActivityGroupProps) {
  const {
    area,
    activity,
    visibleLeaves,
    progress,
    openActivities,
    setOpenActivities,
    forceExpand,
  } = props;

  const hasVariations = activity.variations.length > 0;

  // Activity header status aggregates over its own variations
  const headerStats = useMemo(() => {
    let intro = 0;
    let total = 0;
    const leaves = hasVariations
      ? activity.variations
      : [{ id: activity.id, name: activity.name }];
    for (const leaf of leaves) {
      total += 1;
      const p = progress[leaf.id];
      const filled = p ? p.dates.filter(Boolean).length : 0;
      if (filled > 0) intro += 1;
    }
    return { intro, total };
  }, [activity, progress, hasVariations]);

  const expanded = forceExpand
    ? true
    : openActivities[activity.id] ?? hasVariations === false;

  if (!hasVariations) {
    // Render the activity as a single leaf row directly
    const leaf = visibleLeaves[0];
    return (
      <LeafRow
        area={area}
        leafId={leaf.id}
        leafName={activity.name}
        description={activity.description}
        progress={progress}
        editingSlot={props.editingSlot}
        setEditingSlot={props.setEditingSlot}
        onMarkToday={props.onMarkToday}
        onClear={props.onClear}
        onSetDate={props.onSetDate}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() =>
          setOpenActivities((prev) => ({
            ...prev,
            [activity.id]: !expanded,
          }))
        }
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {activity.name}
            </p>
            {activity.description && (
              <p className="text-xs text-slate-500 truncate">
                {activity.description}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          <span className="font-semibold text-slate-700">
            {headerStats.intro}
          </span>{" "}
          / {headerStats.total}
        </span>
      </button>

      {expanded && (
        <div className="bg-slate-50/40">
          {visibleLeaves.map((leaf) => (
            <LeafRow
              key={leaf.id}
              area={area}
              leafId={leaf.id}
              leafName={leaf.name}
              indented
              progress={progress}
              editingSlot={props.editingSlot}
              setEditingSlot={props.setEditingSlot}
              onMarkToday={props.onMarkToday}
              onClear={props.onClear}
              onSetDate={props.onSetDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type LeafRowProps = {
  area: Area;
  leafId: string;
  leafName: string;
  description?: string;
  indented?: boolean;
  progress: ReturnType<typeof getStudentCurriculumProgress>;
  editingSlot: { leafId: string; slot: number } | null;
  setEditingSlot: (v: { leafId: string; slot: number } | null) => void;
  onMarkToday: (leafId: string, leafName: string) => void;
  onClear: (leafId: string, slot: number) => void;
  onSetDate: (leafId: string, slot: number, date: string) => void;
};

function LeafRow(props: LeafRowProps) {
  const {
    area,
    leafId,
    leafName,
    description,
    indented,
    progress,
    editingSlot,
    setEditingSlot,
    onMarkToday,
    onClear,
    onSetDate,
  } = props;

  const p = progress[leafId];
  const dates: (string | undefined)[] = p
    ? p.dates
    : [undefined, undefined, undefined];
  const status = statusFromDates(dates);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!editingSlot) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setEditingSlot(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editingSlot, setEditingSlot]);

  return (
    <div
      className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
        indented ? "pl-10" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">
          {leafName}
        </p>
        {!indented && description && (
          <p className="text-xs text-slate-500 truncate">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Status pill */}
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_TONE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>

        {/* Three date dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((slot) => {
            const filled = !!dates[slot];
            const isEditing =
              editingSlot?.leafId === leafId && editingSlot.slot === slot;
            return (
              <div key={slot} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setEditingSlot(isEditing ? null : { leafId, slot })
                  }
                  className={`group h-7 px-2 rounded-md text-[11px] font-medium border transition-all flex items-center gap-1 ${
                    filled
                      ? `${area.tone.soft} ${area.tone.text} ${area.tone.border}`
                      : "bg-white border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                  }`}
                  aria-label={`${SLOT_LABEL[slot]}${filled ? `: ${formatShort(dates[slot])}` : ": empty"}`}
                >
                  {filled ? formatShort(dates[slot]) : `· ${slot + 1} ·`}
                </button>

                {isEditing && (
                  <div
                    ref={popoverRef}
                    className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-56 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
                      {SLOT_LABEL[slot]}
                    </p>
                    <input
                      type="date"
                      defaultValue={dates[slot] ?? todayIso()}
                      onChange={(e) =>
                        onSetDate(leafId, slot, e.target.value)
                      }
                      className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-montessori-primary/20"
                    />
                    <div className="flex items-center justify-between mt-2 gap-2">
                      {filled ? (
                        <button
                          onClick={() => onClear(leafId, slot)}
                          className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Clear
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Pick a date
                        </span>
                      )}
                      <button
                        onClick={() => setEditingSlot(null)}
                        className="text-xs text-slate-500 hover:text-slate-900"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mark today button */}
        {status !== "mastered" ? (
          <Button
            size="sm"
            onClick={() => onMarkToday(leafId, leafName)}
            className="h-7 px-2.5 text-[11px] bg-montessori-primary hover:bg-montessori-primary/90"
          >
            <Check className="h-3 w-3 mr-1" />
            Mark today
          </Button>
        ) : (
          <button
            onClick={() => {
              // Undo last (most recent) presentation slot
              let latestIdx = 0;
              for (let i = 1; i < dates.length; i++) {
                if ((dates[i] ?? "") > (dates[latestIdx] ?? "")) latestIdx = i;
              }
              onClear(leafId, latestIdx);
            }}
            className="h-7 px-2 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
            aria-label="Undo last presentation"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
