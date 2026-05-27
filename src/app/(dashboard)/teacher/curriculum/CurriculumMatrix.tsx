"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  addPractice,
  getStudentCurriculumProgress,
  removePractice,
  setCurriculumStatus,
  useDemoStore,
  type CurriculumStatus,
  type DemoCurriculumProgress,
} from "@/lib/mock/demo-store";
import {
  CURRICULUM,
  type Activity,
  type Area,
  type Subcategory,
} from "@/lib/curriculum/curriculum";
import { useToast } from "@/hooks/use-toast";

type Student = {
  id: string;
  name: string;
  classroom: string;
  avatarColor: string;
};

const STATUS_LETTER: Record<CurriculumStatus, string> = {
  "not-started": "",
  introduced: "I",
  developing: "D",
  proficient: "P",
};

const STATUS_LABEL: Record<CurriculumStatus, string> = {
  "not-started": "Not started",
  introduced: "Introduced",
  developing: "Developing",
  proficient: "Proficient",
};

const STATUS_TONE: Record<CurriculumStatus, string> = {
  "not-started": "bg-white text-slate-400 border-slate-100",
  introduced: "bg-sky-100 text-sky-800 border-sky-200 font-semibold",
  developing: "bg-amber-200 text-amber-900 border-amber-300 font-bold",
  proficient: "bg-emerald-600 text-white border-emerald-700 font-bold",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type OpenCell = { studentId: string; leafId: string } | null;

export function CurriculumMatrix({
  students,
}: {
  students: Student[];
}) {
  // Subscribe directly to the store so cell edits re-render the matrix
  // immediately (the parent subscribes too, but pulling the snapshot here
  // guarantees every CellEditor mutation is reflected without a re-mount).
  const snapshot = useDemoStore();
  const [activeAreaId, setActiveAreaId] = useState(CURRICULUM[0].id);
  const [search, setSearch] = useState("");
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const area of CURRICULUM) {
      area.subcategories.forEach((sub, i) => {
        m[sub.id] = i === 0;
      });
    }
    return m;
  });
  const [openActivities, setOpenActivities] = useState<Record<string, boolean>>(
    {},
  );
  const [openCell, setOpenCell] = useState<OpenCell>(null);

  const activeArea =
    CURRICULUM.find((a) => a.id === activeAreaId) ?? CURRICULUM[0];

  // Recompute on every store snapshot so cells reflect the latest status
  // and practice counts after edits in the inline editor popover.
  const progressByStudent = useMemo(() => {
    const map: Record<string, Record<string, DemoCurriculumProgress>> = {};
    for (const s of students) map[s.id] = getStudentCurriculumProgress(s.id);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, snapshot]);

  const trimmedSearch = search.trim().toLowerCase();

  return (
    <div className="space-y-4">
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

      {/* Search + legend */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity or variation…"
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <LegendChip status="introduced" label="Introduced" />
          <LegendChip status="developing" label="Developing" />
          <LegendChip status="proficient" label="Proficient" />
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Click any cell to edit</span>
        </div>
      </div>

      {/* Matrix */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto overflow-y-visible">
          <table
            className="border-collapse text-[12px] min-w-full"
            style={{ borderSpacing: 0 }}
          >
            <thead>
              <tr>
                <th
                  className={`sticky left-0 z-20 ${activeArea.tone.soft} ${activeArea.tone.text} border-b border-r border-slate-200 text-left px-4 py-3 align-bottom min-w-[280px]`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    {activeArea.name}
                  </span>
                </th>
                {students.map((s) => (
                  <th
                    key={s.id}
                    className="border-b border-l border-slate-200 px-1 pt-3 pb-2 align-bottom bg-white"
                    style={{ minWidth: 40, width: 40, height: 132 }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full ${s.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shadow-sm`}
                      >
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div
                        className="text-[12px] text-slate-900 font-semibold tracking-tight whitespace-nowrap"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {s.name.split(" ")[0]}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeArea.subcategories.map((sub) => (
                <SubcategoryRows
                  key={sub.id}
                  area={activeArea}
                  sub={sub}
                  students={students}
                  progressByStudent={progressByStudent}
                  isOpen={
                    trimmedSearch.length > 0
                      ? true
                      : (openSubs[sub.id] ?? false)
                  }
                  onToggleSub={() =>
                    setOpenSubs((prev) => ({
                      ...prev,
                      [sub.id]: !prev[sub.id],
                    }))
                  }
                  openActivities={openActivities}
                  setOpenActivities={setOpenActivities}
                  search={trimmedSearch}
                  openCell={openCell}
                  setOpenCell={setOpenCell}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LegendChip({
  status,
  label,
}: {
  status: CurriculumStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${STATUS_TONE[status]}`}
    >
      <span className="font-bold">{STATUS_LETTER[status] || "·"}</span>
      <span className="text-slate-700 font-medium">{label}</span>
    </span>
  );
}

type SubProps = {
  area: Area;
  sub: Subcategory;
  students: Student[];
  progressByStudent: Record<string, Record<string, DemoCurriculumProgress>>;
  isOpen: boolean;
  onToggleSub: () => void;
  openActivities: Record<string, boolean>;
  setOpenActivities: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  search: string;
  openCell: OpenCell;
  setOpenCell: (cell: OpenCell) => void;
};

function SubcategoryRows(props: SubProps) {
  const {
    area,
    sub,
    students,
    progressByStudent,
    isOpen,
    onToggleSub,
    search,
  } = props;

  const matchingActivities = useMemo(() => {
    return sub.activities.filter((act) => {
      if (search === "") return true;
      const haystack = (
        act.name +
        " " +
        act.variations.map((v) => v.name).join(" ")
      ).toLowerCase();
      return haystack.includes(search);
    });
  }, [sub.activities, search]);

  if (search.length > 0 && matchingActivities.length === 0) return null;

  return (
    <>
      <tr className="bg-slate-50/70 border-t border-slate-200">
        <td
          colSpan={students.length + 1}
          className="sticky left-0 z-10 bg-slate-50/70"
        >
          <button
            onClick={onToggleSub}
            className="w-full flex items-center gap-2 px-4 py-2 text-left"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="text-[13px] font-semibold text-slate-800">
              {sub.name}
            </span>
          </button>
        </td>
      </tr>
      {isOpen &&
        matchingActivities.map((act) => (
          <ActivityRows
            key={act.id}
            area={area}
            activity={act}
            students={students}
            progressByStudent={progressByStudent}
            openActivities={props.openActivities}
            setOpenActivities={props.setOpenActivities}
            forceExpand={search.length > 0}
            openCell={props.openCell}
            setOpenCell={props.setOpenCell}
          />
        ))}
    </>
  );
}

type ActProps = {
  area: Area;
  activity: Activity;
  students: Student[];
  progressByStudent: Record<string, Record<string, DemoCurriculumProgress>>;
  openActivities: Record<string, boolean>;
  setOpenActivities: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;
  forceExpand: boolean;
  openCell: OpenCell;
  setOpenCell: (cell: OpenCell) => void;
};

function ActivityRows(props: ActProps) {
  const {
    area,
    activity,
    students,
    progressByStudent,
    openActivities,
    setOpenActivities,
    forceExpand,
  } = props;

  const hasVariations = activity.variations.length > 0;

  if (!hasVariations) {
    return (
      <LeafRow
        area={area}
        leafId={activity.id}
        leafName={activity.name}
        students={students}
        progressByStudent={progressByStudent}
        openCell={props.openCell}
        setOpenCell={props.setOpenCell}
      />
    );
  }

  const expanded = forceExpand ? true : (openActivities[activity.id] ?? false);

  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="sticky left-0 z-10 bg-white">
          <button
            onClick={() =>
              setOpenActivities((prev) => ({
                ...prev,
                [activity.id]: !expanded,
              }))
            }
            className="w-full flex items-center gap-1.5 px-4 py-1.5 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-400" />
            )}
            <span className="text-[12.5px] font-medium text-slate-700">
              {activity.name}
            </span>
          </button>
        </td>
        {students.map((s) => (
          <td
            key={s.id}
            className="border-l border-slate-100"
            style={{ minWidth: 40, width: 40 }}
          />
        ))}
      </tr>
      {expanded &&
        activity.variations.map((v) => (
          <LeafRow
            key={v.id}
            area={area}
            leafId={v.id}
            leafName={v.name}
            indented
            students={students}
            progressByStudent={progressByStudent}
            openCell={props.openCell}
            setOpenCell={props.setOpenCell}
          />
        ))}
    </>
  );
}

function LeafRow({
  area,
  leafId,
  leafName,
  indented,
  students,
  progressByStudent,
  openCell,
  setOpenCell,
}: {
  area: Area;
  leafId: string;
  leafName: string;
  indented?: boolean;
  students: Student[];
  progressByStudent: Record<string, Record<string, DemoCurriculumProgress>>;
  openCell: OpenCell;
  setOpenCell: (cell: OpenCell) => void;
}) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/50 group">
      <td
        className={`sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 px-4 py-1.5 ${
          indented ? "pl-12" : "pl-8"
        }`}
      >
        <span className="text-[12px] text-slate-700">{leafName}</span>
      </td>
      {students.map((s) => {
        const progress = progressByStudent[s.id]?.[leafId];
        const status: CurriculumStatus = progress?.status ?? "not-started";
        const practiceCount = progress?.practices.length ?? 0;
        const isOpen =
          openCell?.studentId === s.id && openCell.leafId === leafId;
        return (
          <td
            key={s.id}
            className="border-l border-slate-100 relative"
            style={{ minWidth: 40, width: 40, height: 30, padding: 0 }}
          >
            <button
              onClick={() =>
                setOpenCell(
                  isOpen ? null : { studentId: s.id, leafId },
                )
              }
              className={`w-full h-full text-[11px] flex items-center justify-center transition-colors border ${
                status === "not-started"
                  ? `border-transparent ${area.tone.soft}`
                  : STATUS_TONE[status]
              } ${isOpen ? "ring-2 ring-offset-1 ring-montessori-primary z-30 relative" : ""}`}
              title={`${s.name} · ${leafName}`}
            >
              {STATUS_LETTER[status]}
            </button>
            {isOpen && (
              <CellEditor
                studentId={s.id}
                studentName={s.name}
                leafId={leafId}
                leafName={leafName}
                status={status}
                practices={progress?.practices ?? []}
                onClose={() => setOpenCell(null)}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

function CellEditor({
  studentId,
  studentName,
  leafId,
  leafName,
  status,
  practices,
  onClose,
}: {
  studentId: string;
  studentName: string;
  leafId: string;
  leafName: string;
  status: CurriculumStatus;
  practices: string[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const change = (next: CurriculumStatus) => {
    setCurriculumStatus(studentId, leafId, next);
    toast({
      title: `Marked ${STATUS_LABEL[next].toLowerCase()}`,
      description: `${studentName} · ${leafName}`,
    });
  };

  const logToday = () => {
    addPractice(studentId, leafId);
    toast({
      title: "Practice recorded for today",
      description: `${studentName} · ${leafName}`,
    });
  };

  const logOn = (date: string) => {
    if (!date) return;
    addPractice(studentId, leafId, date);
    toast({
      title: "Practice recorded",
      description: `${studentName} · ${leafName} · ${date}`,
    });
  };

  const recent = [...practices].reverse().slice(0, 6);

  return (
    <div
      ref={ref}
      className="absolute z-40 top-full right-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-in fade-in slide-in-from-top-1 duration-150 text-left"
      style={{ minWidth: 280 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
            {studentName}
          </p>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {leafName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-slate-600 shrink-0"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status picker */}
      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">
        Status
      </p>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {(
          ["not-started", "introduced", "developing", "proficient"] as const
        ).map((s) => (
          <button
            key={s}
            onClick={() => change(s)}
            className={`text-[11px] px-2 py-1.5 rounded-md border transition-all flex items-center justify-center gap-1 ${
              status === s
                ? STATUS_TONE[s]
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {STATUS_LETTER[s] && (
              <span className="font-bold">{STATUS_LETTER[s]}</span>
            )}
            <span>{STATUS_LABEL[s]}</span>
          </button>
        ))}
      </div>

      {/* Practice log */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
            Practice log
          </p>
          <span className="text-[10px] text-slate-400">
            {practices.length} total
          </span>
        </div>

        {practices.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic mb-2">
            No practices recorded yet.
          </p>
        ) : (
          <ul className="space-y-0.5 mb-2 max-h-28 overflow-y-auto">
            {recent.map((d, i) => (
              <li
                key={`${d}-${i}`}
                className="flex items-center justify-between gap-2 text-[11px] text-slate-700 group/row"
              >
                <span>
                  {new Date(d).toLocaleDateString("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <button
                  onClick={() => removePractice(studentId, leafId, d)}
                  className="text-rose-400 hover:text-rose-700 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  aria-label="Remove this practice"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
            {practices.length > recent.length && (
              <li className="text-[10px] text-slate-400">
                · {practices.length - recent.length} earlier
              </li>
            )}
          </ul>
        )}

        <button
          onClick={logToday}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-medium bg-montessori-primary text-white rounded-md py-1.5 hover:bg-montessori-primary/90 mb-1.5"
        >
          <Plus className="w-3 h-3" /> Practice today
        </button>
        <input
          type="date"
          defaultValue={todayIso()}
          onChange={(e) => logOn(e.target.value)}
          className="w-full text-[11px] border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-montessori-primary/20"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Pick a date to log a past practice.
        </p>
      </div>
    </div>
  );
}
