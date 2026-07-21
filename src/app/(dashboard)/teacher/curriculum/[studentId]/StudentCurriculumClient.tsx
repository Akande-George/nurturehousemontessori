"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRICULUM,
  type Activity,
  type Area,
  type Subcategory,
} from "@/lib/curriculum/curriculum";
import {
  getCurriculumStats,
  touchedPercent,
  type ProgressMap,
} from "@/lib/curriculum/progress-utils";
import { setCurriculumStatus, addPractice } from "@/lib/actions/montessori";
import { useToast } from "@/hooks/use-toast";
import type { CurriculumStatus, Student } from "@/lib/db/types";

type Filter = "all" | "in-progress" | "proficient" | "not-started";

const STATUS_LABEL: Record<CurriculumStatus, string> = {
  not_started: "Not started",
  introduced: "Introduced",
  developing: "Developing",
  proficient: "Proficient",
};

const STATUS_TONE: Record<CurriculumStatus, string> = {
  not_started: "bg-slate-100 text-slate-500 border-slate-200",
  introduced: "bg-sky-50 text-sky-700 border-sky-200",
  developing: "bg-amber-50 text-amber-700 border-amber-200",
  proficient: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function leafMatchesFilter(status: CurriculumStatus, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "proficient") return status === "proficient";
  if (filter === "not-started") return status === "not_started";
  return status === "introduced" || status === "developing";
}

export function StudentCurriculumClient({
  student,
  progress,
}: {
  student: Student;
  progress: ProgressMap;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [activeAreaId, setActiveAreaId] = useState(CURRICULUM[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const area of CURRICULUM) {
      area.subcategories.forEach((sub, idx) => {
        initial[sub.id] = idx === 0;
      });
    }
    return initial;
  });
  const [openActivities, setOpenActivities] = useState<Record<string, boolean>>({});

  const stats = getCurriculumStats(progress);
  const activeArea = CURRICULUM.find((a) => a.id === activeAreaId) ?? CURRICULUM[0];
  const trimmedSearch = search.trim().toLowerCase();
  const overallPct = touchedPercent(stats.overall);

  const runAction = (fn: () => Promise<{ ok: boolean; error?: string }>, okTitle: string, okDesc?: string) => {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast({ title: okTitle, description: okDesc });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  const handleAddPracticeToday = (leafId: string, leafName: string) =>
    runAction(() => addPractice({ studentId: student.id, leafId }), "Practice recorded for today", leafName);

  const handleAddPracticeOnDate = (leafId: string, date: string) => {
    if (!date) return;
    runAction(() => addPractice({ studentId: student.id, leafId, date }), "Practice recorded");
  };

  const handleStatusChange = (leafId: string, status: CurriculumStatus) =>
    runAction(
      () => setCurriculumStatus({ studentId: student.id, leafId, status }),
      `Marked ${STATUS_LABEL[status].toLowerCase()}`,
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/teacher/curriculum" className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Back to curriculum index">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif text-slate-900 truncate">{student.name}</h1>
          <p className="text-sm text-slate-500">Record Book · {student.classroom ?? "—"}</p>
        </div>
        <Link
          href={`/teacher/observations/${student.id}`}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-montessori-primary hover:underline"
        >
          <BookOpen className="h-3.5 w-3.5" />
          View journal
        </Link>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Overall progress</p>
              <p className="text-2xl font-serif text-slate-900 mt-1">
                {stats.overall.introduced + stats.overall.developing + stats.overall.proficient}{" "}
                <span className="text-slate-400 text-base font-sans font-normal">
                  / {stats.overall.total} activities introduced
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.overall.proficient} proficient · {stats.overall.developing} developing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-3xl font-bold text-montessori-primary">{overallPct}%</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Touched</p>
              </div>
              <div className="w-20 h-20 rounded-full bg-slate-50 grid place-items-center">
                <div
                  className="w-16 h-16 rounded-full grid place-items-center text-white text-sm font-bold"
                  style={{ background: `conic-gradient(rgb(12 92 76) ${overallPct}%, #e2e8f0 ${overallPct}%)` }}
                >
                  <div className="w-12 h-12 rounded-full bg-white grid place-items-center text-slate-700 text-sm font-bold">
                    {overallPct}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            {CURRICULUM.map((area) => {
              const pct = touchedPercent(stats.byArea[area.id]);
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
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold truncate">{area.name}</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {pct}
                    <span className="text-xs text-slate-400 font-normal">%</span>
                  </p>
                  <div className="h-1 mt-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${area.tone.accent} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {CURRICULUM.map((area) => (
            <button
              key={area.id}
              onClick={() => setActiveAreaId(area.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeAreaId === area.id ? `bg-white shadow-sm ${area.tone.text}` : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

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
          {(["all", "in-progress", "proficient", "not-started"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "All" : f === "in-progress" ? "In progress" : f === "proficient" ? "Proficient" : "Not started"}
            </button>
          ))}
        </div>
      </div>

      <AreaBody
        area={activeArea}
        progress={progress}
        search={trimmedSearch}
        filter={filter}
        openSubs={openSubs}
        setOpenSubs={setOpenSubs}
        openActivities={openActivities}
        setOpenActivities={setOpenActivities}
        pending={pending}
        onAddPracticeToday={handleAddPracticeToday}
        onAddPracticeOnDate={handleAddPracticeOnDate}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

type SharedHandlers = {
  pending: boolean;
  onAddPracticeToday: (leafId: string, leafName: string) => void;
  onAddPracticeOnDate: (leafId: string, date: string) => void;
  onStatusChange: (leafId: string, status: CurriculumStatus) => void;
};

type AreaBodyProps = SharedHandlers & {
  area: Area;
  progress: ProgressMap;
  search: string;
  filter: Filter;
  openSubs: Record<string, boolean>;
  setOpenSubs: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  openActivities: Record<string, boolean>;
  setOpenActivities: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
};

function AreaBody(props: AreaBodyProps) {
  const { area, search, filter, openSubs, setOpenSubs } = props;
  return (
    <div className="space-y-3">
      <div className={`rounded-lg p-3 ${area.tone.soft} border ${area.tone.border}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${area.tone.text}`}>{area.name}</p>
        <p className="text-sm text-slate-600 mt-1">{area.description}</p>
      </div>

      {area.subcategories.map((sub) => (
        <SubcategoryBlock
          key={sub.id}
          area={area}
          sub={sub}
          isOpen={openSubs[sub.id] ?? false}
          onToggle={() => setOpenSubs((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
          search={search}
          filter={filter}
          progress={props.progress}
          openActivities={props.openActivities}
          setOpenActivities={props.setOpenActivities}
          pending={props.pending}
          onAddPracticeToday={props.onAddPracticeToday}
          onAddPracticeOnDate={props.onAddPracticeOnDate}
          onStatusChange={props.onStatusChange}
        />
      ))}
    </div>
  );
}

type SubcategoryBlockProps = SharedHandlers & {
  area: Area;
  sub: Subcategory;
  isOpen: boolean;
  onToggle: () => void;
  search: string;
  filter: Filter;
  progress: ProgressMap;
  openActivities: Record<string, boolean>;
  setOpenActivities: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
};

function SubcategoryBlock(props: SubcategoryBlockProps) {
  const { area, sub, isOpen, onToggle, search, filter, progress } = props;

  const subStats = useMemo(() => {
    let introduced = 0;
    let total = 0;
    for (const act of sub.activities) {
      const leaves = act.variations.length === 0 ? [{ id: act.id, name: act.name }] : act.variations;
      for (const leaf of leaves) {
        total += 1;
        const p = progress[leaf.id];
        if (p && p.status !== "not_started") introduced += 1;
      }
    }
    return { introduced, total };
  }, [sub.activities, progress]);

  const filteredActivities = useMemo(() => {
    return sub.activities
      .map((act) => {
        const leaves = act.variations.length === 0 ? [{ id: act.id, name: act.name }] : act.variations;
        const visibleLeaves = leaves.filter((leaf) => {
          const haystack = `${act.name} ${leaf.name}`.toLowerCase();
          const matchesSearch = search === "" || haystack.includes(search);
          const p = progress[leaf.id];
          const status: CurriculumStatus = p ? p.status : "not_started";
          return matchesSearch && leafMatchesFilter(status, filter);
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
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <p className="text-sm font-semibold text-slate-900 truncate">{sub.name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span>
            <span className="font-semibold text-slate-700">{subStats.introduced}</span> / {subStats.total}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${area.tone.accent}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {filteredActivities.map(({ activity, leaves }) => (
            <ActivityGroup
              key={activity.id}
              activity={activity}
              visibleLeaves={leaves}
              progress={progress}
              openActivities={props.openActivities}
              setOpenActivities={props.setOpenActivities}
              forceExpand={search.length > 0}
              pending={props.pending}
              onAddPracticeToday={props.onAddPracticeToday}
              onAddPracticeOnDate={props.onAddPracticeOnDate}
              onStatusChange={props.onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ActivityGroupProps = SharedHandlers & {
  activity: Activity;
  visibleLeaves: { id: string; name: string }[];
  progress: ProgressMap;
  openActivities: Record<string, boolean>;
  setOpenActivities: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  forceExpand: boolean;
};

function ActivityGroup(props: ActivityGroupProps) {
  const { activity, visibleLeaves, progress, openActivities, setOpenActivities, forceExpand } = props;
  const hasVariations = activity.variations.length > 0;

  const headerStats = useMemo(() => {
    let intro = 0;
    let total = 0;
    const leaves = hasVariations ? activity.variations : [{ id: activity.id, name: activity.name }];
    for (const leaf of leaves) {
      total += 1;
      const p = progress[leaf.id];
      if (p && p.status !== "not_started") intro += 1;
    }
    return { intro, total };
  }, [activity, progress, hasVariations]);

  const expanded = forceExpand ? true : (openActivities[activity.id] ?? hasVariations === false);

  if (!hasVariations) {
    const leaf = visibleLeaves[0];
    return (
      <LeafRow
        leafId={leaf.id}
        leafName={activity.name}
        description={activity.description}
        progress={progress}
        pending={props.pending}
        onAddPracticeToday={props.onAddPracticeToday}
        onAddPracticeOnDate={props.onAddPracticeOnDate}
        onStatusChange={props.onStatusChange}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpenActivities((prev) => ({ ...prev, [activity.id]: !expanded }))}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{activity.name}</p>
            {activity.description && <p className="text-xs text-slate-500 truncate">{activity.description}</p>}
          </div>
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          <span className="font-semibold text-slate-700">{headerStats.intro}</span> / {headerStats.total}
        </span>
      </button>

      {expanded && (
        <div className="bg-slate-50/40">
          {visibleLeaves.map((leaf) => (
            <LeafRow
              key={leaf.id}
              leafId={leaf.id}
              leafName={leaf.name}
              indented
              progress={progress}
              pending={props.pending}
              onAddPracticeToday={props.onAddPracticeToday}
              onAddPracticeOnDate={props.onAddPracticeOnDate}
              onStatusChange={props.onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type LeafRowProps = SharedHandlers & {
  leafId: string;
  leafName: string;
  description?: string;
  indented?: boolean;
  progress: ProgressMap;
};

function LeafRow(props: LeafRowProps) {
  const { leafId, leafName, description, indented, progress, pending } = props;
  const [showHistory, setShowHistory] = useState(false);

  const p = progress[leafId];
  const practices = p ? p.practices : [];
  const status: CurriculumStatus = p ? p.status : "not_started";
  const practiceCount = practices.length;
  const lastPractice = practices[practices.length - 1];

  return (
    <div className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${indented ? "pl-10" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{leafName}</p>
        {!indented && description && <p className="text-xs text-slate-500 truncate">{description}</p>}
        {practiceCount > 0 && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {practiceCount} practice{practiceCount === 1 ? "" : "s"}
            {lastPractice ? ` · last on ${formatShort(lastPractice)}` : ""}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-all flex items-center gap-1.5 ${
              practiceCount > 0
                ? "bg-slate-50 text-slate-600 border-slate-200"
                : "bg-white border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
            }`}
          >
            <span className="font-semibold">{practiceCount}</span>
            <span>practice{practiceCount === 1 ? "" : "s"}</span>
          </button>

          {showHistory && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-72 animate-in fade-in slide-in-from-top-1 duration-150">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Practice history</p>
              {practiceCount === 0 ? (
                <p className="text-xs text-slate-400 italic mt-2">No practices recorded yet.</p>
              ) : (
                <ul className="mt-2 max-h-44 overflow-y-auto space-y-1">
                  {[...practices].reverse().map((d, i) => (
                    <li key={`${d}-${i}`} className="text-xs text-slate-700">
                      {new Date(d).toLocaleDateString("en-NG", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">
                  Add a practice on a specific day
                </p>
                <input
                  type="date"
                  defaultValue={todayIso()}
                  onChange={(e) => props.onAddPracticeOnDate(leafId, e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-montessori-primary/20"
                />
              </div>
            </div>
          )}
        </div>

        <Button
          size="sm"
          disabled={pending}
          onClick={() => props.onAddPracticeToday(leafId, leafName)}
          className="h-7 px-2.5 text-[11px] bg-montessori-primary hover:bg-montessori-primary/90"
        >
          <Plus className="h-3 w-3 mr-1" /> Practice today
        </Button>

        <Select value={status} onValueChange={(v) => props.onStatusChange(leafId, v as CurriculumStatus)}>
          <SelectTrigger className={`h-7 px-2 text-[11px] font-medium border ${STATUS_TONE[status]} w-[120px]`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not started</SelectItem>
            <SelectItem value="introduced">Introduced</SelectItem>
            <SelectItem value="developing">Developing</SelectItem>
            <SelectItem value="proficient">
              <span className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-600" />
                Proficient
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
