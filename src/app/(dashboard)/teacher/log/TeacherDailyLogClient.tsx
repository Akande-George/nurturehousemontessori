"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addDailyActivityLogs } from "@/lib/actions/montessori";
import { deleteDailyActivityLog, updateDailyActivityLog } from "@/lib/actions/daily-logs";
import { FEVER_THRESHOLD_C } from "@/lib/montessori/daily";
import type { Student } from "@/lib/db/types";

export type DailyLog = {
  id: string;
  student_id: string;
  log_date: string;
  log_time: string | null;
  activity_type: string;
  value: string | null;
  notes: string | null;
  created_at: string;
};

type LogTab = "meals" | "nap" | "hygiene" | "temperature";

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
// The per-type choices behind a log's free-text `value`. Shared by the add form
// and the edit dialog so an edited entry is stored in the same shape.
type CareFields = {
  mealType: string;
  mealAmount: string;
  napDuration: string;
  hygieneType: string;
  temperatureC: string;
};
const DEFAULT_FIELDS: CareFields = {
  mealType: "AM Snack",
  mealAmount: "All",
  napDuration: "45 mins",
  hygieneType: "Toilet",
  temperatureC: "36.8",
};
const FEVER_LABEL = `${FEVER_THRESHOLD_C.toFixed(1)}°C`;
const LOG_TABS: LogTab[] = ["meals", "nap", "hygiene", "temperature"];

function getValueForTab(tab: LogTab, opts: CareFields) {
  if (tab === "meals") return `${opts.mealType} (${opts.mealAmount})`;
  if (tab === "nap") return opts.napDuration;
  if (tab === "temperature") return `${opts.temperatureC}°C`;
  return opts.hygieneType;
}
// Inverse of getValueForTab, for pre-filling the edit dialog. A nap/hygiene value
// that matches no chip is kept as-is; an unparseable meal or temperature falls
// back to the defaults.
function fieldsFromLog(tab: LogTab, value: string | null): CareFields {
  const v = (value ?? "").trim();
  if (tab === "meals") {
    const m = /^(.*)\s\((.*)\)$/.exec(v);
    return m ? { ...DEFAULT_FIELDS, mealType: m[1], mealAmount: m[2] } : DEFAULT_FIELDS;
  }
  if (tab === "nap") return { ...DEFAULT_FIELDS, napDuration: v || DEFAULT_FIELDS.napDuration };
  if (tab === "temperature") {
    const c = parseFloat(v.replace(/[^0-9.]/g, ""));
    return { ...DEFAULT_FIELDS, temperatureC: Number.isNaN(c) ? DEFAULT_FIELDS.temperatureC : String(c) };
  }
  return { ...DEFAULT_FIELDS, hygieneType: v || DEFAULT_FIELDS.hygieneType };
}
function asLogTab(type: string): LogTab {
  return (LOG_TABS as string[]).includes(type) ? (type as LogTab) : "meals";
}
function toTitle(tab: LogTab) {
  if (tab === "meals") return "Meal";
  if (tab === "nap") return "Nap";
  if (tab === "temperature") return "Temperature";
  return "Hygiene";
}
function temperatureFlag(c: number): { label: string; className: string } | null {
  if (Number.isNaN(c)) return null;
  if (c >= FEVER_THRESHOLD_C) return { label: "Fever — notify parents", className: "text-rose-700 bg-rose-50 border-rose-200" };
  if (c >= 37.5) return { label: "Slightly elevated — monitor", className: "text-amber-700 bg-amber-50 border-amber-200" };
  if (c < 36.0) return { label: "Low — keep warm and recheck", className: "text-sky-700 bg-sky-50 border-sky-200" };
  return null;
}
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("");
}

function ChoiceChips({
  options,
  value,
  onChange,
  gridClassName,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  gridClassName: string;
}) {
  return (
    <div className={`grid ${gridClassName} gap-3`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
            value === option
              ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
              : "border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// The value controls for one record type.
function CareValueFields({
  tab,
  fields,
  onChange,
}: {
  tab: LogTab;
  fields: CareFields;
  onChange: (patch: Partial<CareFields>) => void;
}) {
  if (tab === "meals") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Meal Type</label>
          <ChoiceChips
            options={["AM Snack", "Lunch", "PM Snack"]}
            value={fields.mealType}
            onChange={(mealType) => onChange({ mealType })}
            gridClassName="grid-cols-3"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Amount Eaten</label>
          <ChoiceChips
            options={["All", "Most", "Some", "None"]}
            value={fields.mealAmount}
            onChange={(mealAmount) => onChange({ mealAmount })}
            gridClassName="grid-cols-4"
          />
        </div>
      </div>
    );
  }

  if (tab === "nap") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Nap Duration</label>
          <ChoiceChips
            options={["30 mins", "45 mins", "60+ mins"]}
            value={fields.napDuration}
            onChange={(napDuration) => onChange({ napDuration })}
            gridClassName="grid-cols-3"
          />
        </div>
      </div>
    );
  }

  if (tab === "hygiene") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Hygiene Type</label>
          <ChoiceChips
            options={["Toilet", "Diaper Change", "Hand Wash"]}
            value={fields.hygieneType}
            onChange={(hygieneType) => onChange({ hygieneType })}
            gridClassName="grid-cols-3"
          />
        </div>
      </div>
    );
  }

  const flag = temperatureFlag(parseFloat(fields.temperatureC));
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Temperature (°C)</label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            type="number"
            step="0.1"
            min="34"
            max="42"
            value={fields.temperatureC}
            onChange={(e) => onChange({ temperatureC: e.target.value })}
            className="w-full sm:w-40 text-lg font-semibold"
          />
          <div className="flex flex-wrap gap-2">
            {["36.5", "37.0", "37.5", "38.0", "38.5"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ temperatureC: t })}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  fields.temperatureC === t
                    ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {t}°
              </button>
            ))}
          </div>
        </div>
        {flag ? (
          <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${flag.className}`}>
            {flag.label}
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Normal range. Recheck if the child becomes warm to the touch.
          </p>
        )}
      </div>
    </div>
  );
}

export function TeacherDailyLogClient({ students, logs }: { students: Student[]; logs: DailyLog[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  const [activeTab, setActiveTab] = useState<LogTab>("meals");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [date, setDate] = useState(getTodayIsoDate());
  const [time, setTime] = useState(getCurrentTime());
  const [fields, setFields] = useState<CareFields>(DEFAULT_FIELDS);
  const [details, setDetails] = useState("");

  // Editing one already-logged entry.
  const [editing, setEditing] = useState<DailyLog | null>(null);
  const [editTab, setEditTab] = useState<LogTab>("meals");
  const [editFields, setEditFields] = useState<CareFields>(DEFAULT_FIELDS);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const logsForDate = useMemo(() => logs.filter((l) => l.log_date === date), [logs, date]);

  const toggleStudent = (id: string) =>
    setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const selectAll = () => {
    if (selectedStudents.length === students.length) setSelectedStudents([]);
    else setSelectedStudents(students.map((s) => s.id));
  };

  const resetForm = () => {
    setDetails("");
    setFields(DEFAULT_FIELDS);
    setTime(getCurrentTime());
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) return;
    const value = getValueForTab(activeTab, fields);
    start(async () => {
      const res = await addDailyActivityLogs({
        studentIds: selectedStudents,
        date,
        time,
        activityType: activeTab,
        value,
        notes: details,
      });
      if (res.ok) {
        toast({
          title: "Daily activity saved",
          description: `${toTitle(activeTab)} record saved for ${selectedStudents.length} student${selectedStudents.length === 1 ? "" : "s"}.`,
        });
        resetForm();
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  const openEdit = (log: DailyLog) => {
    const tab = asLogTab(log.activity_type);
    setEditing(log);
    setEditTab(tab);
    setEditFields(fieldsFromLog(tab, log.value));
    setEditDate(log.log_date);
    setEditTime(log.log_time?.slice(0, 5) ?? "");
    setEditNotes(log.notes ?? "");
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const log = editing;
    start(async () => {
      const res = await updateDailyActivityLog({
        id: log.id,
        date: editDate,
        time: editTime,
        activityType: editTab,
        value: getValueForTab(editTab, editFields),
        notes: editNotes,
      });
      if (!res.ok) {
        toast({ title: "Could not update entry", description: res.error, variant: "destructive" });
        return;
      }
      setEditing(null);
      toast({
        title: "Entry updated",
        description: res.notified
          ? "The reading is now a fever, so parents have been emailed."
          : `The ${toTitle(editTab).toLowerCase()} record for ${studentMap.get(log.student_id)?.name ?? "this child"} has been corrected.`,
      });
      router.refresh();
    });
  };

  const handleDelete = (log: DailyLog) => {
    const name = studentMap.get(log.student_id)?.name ?? "this child";
    if (!window.confirm(`Delete this ${toTitle(asLogTab(log.activity_type)).toLowerCase()} entry for ${name}?`)) return;
    start(async () => {
      const res = await deleteDailyActivityLog(log.id);
      if (!res.ok) {
        toast({ title: "Could not delete entry", description: res.error, variant: "destructive" });
        return;
      }
      if (editing?.id === log.id) setEditing(null);
      toast({ title: "Entry deleted", description: `Removed from ${name}'s daily trail.` });
      router.refresh();
    });
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Daily Activity Recording</h1>
          <p className="text-sm text-slate-500">
            Record meals, naps, and hygiene updates for your class and keep a clean daily trail.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="text-xs font-medium text-slate-500">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full sm:w-[180px]" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Time</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full sm:w-[140px]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-slate-100 shadow-sm lg:col-span-1 flex flex-col h-[640px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h2 className="font-medium text-slate-900 text-sm">Select Students</h2>
            <Button variant="link" onClick={selectAll} className="text-xs font-medium text-montessori-primary p-0 h-auto">
              {selectedStudents.length === students.length && students.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedStudents.includes(student.id)
                    ? "border-montessori-primary bg-montessori-primary/5"
                    : "border-slate-100 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full ${student.avatar_color} text-white flex items-center justify-center font-medium text-xs`}>
                    {initials(student.name)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedStudents.includes(student.id) ? "text-montessori-primary" : "text-slate-900"}`}>
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{student.classroom ?? "—"}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedStudents.includes(student.id) ? "border-montessori-primary bg-montessori-primary text-white" : "border-slate-300"
                }`}>
                  {selectedStudents.includes(student.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <p className="text-sm text-slate-600 font-medium text-center">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 shadow-sm p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LogTab)} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="nap">Naps</TabsTrigger>
                <TabsTrigger value="hygiene">Hygiene</TabsTrigger>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
              </TabsList>
            </Tabs>

            <CareValueFields
              tab={activeTab}
              fields={fields}
              onChange={(patch) => setFields((prev) => ({ ...prev, ...patch }))}
            />

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px]"
                placeholder="Add context that should be visible in today's record trail."
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm} className="px-6 rounded-full font-medium">
                Reset
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedStudents.length === 0 || pending}
                className="px-8 rounded-full bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm"
              >
                {pending ? "Saving…" : "Save Daily Record"}
              </Button>
            </div>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Recorded Entries ({logsForDate.length})</h2>
                <p className="text-xs text-slate-500">{date}</p>
              </div>

              {logsForDate.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center border border-dashed rounded-xl border-slate-200">
                  No entries recorded for this date yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {logsForDate.map((log) => {
                    const student = studentMap.get(log.student_id);
                    return (
                      <div key={log.id} className="rounded-xl border border-slate-100 p-3.5 bg-white">
                        <div className="flex flex-wrap items-center gap-2 justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold text-white ${student?.avatar_color ?? "bg-slate-400"}`}>
                              {student ? initials(student.name) : "?"}
                            </span>
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {student?.name ?? "Unknown student"}
                            </p>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                              {log.activity_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-slate-400 mr-1">{log.log_time ?? ""}</p>
                            <button
                              type="button"
                              onClick={() => openEdit(log)}
                              disabled={pending}
                              aria-label="Edit entry"
                              className="text-slate-400 hover:text-montessori-primary transition-colors p-1.5 rounded-md hover:bg-slate-100"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(log)}
                              disabled={pending}
                              aria-label="Delete entry"
                              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700">{log.value}</p>
                        {log.notes && <p className="text-xs text-slate-500 mt-1.5">{log.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
            <DialogDescription>
              Correct this record for {editing ? studentMap.get(editing.student_id)?.name ?? "this child" : ""}.
              A reading changed to {FEVER_LABEL} or above emails the parents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Date</label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Time</label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Tabs value={editTab} onValueChange={(v) => setEditTab(v as LogTab)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="nap">Naps</TabsTrigger>
                <TabsTrigger value="hygiene">Hygiene</TabsTrigger>
                <TabsTrigger value="temperature">Temp</TabsTrigger>
              </TabsList>
            </Tabs>
            <CareValueFields
              tab={editTab}
              fields={editFields}
              onChange={(patch) => setEditFields((prev) => ({ ...prev, ...patch }))}
            />
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => editing && handleDelete(editing)}
              disabled={pending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={pending || !editDate}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
