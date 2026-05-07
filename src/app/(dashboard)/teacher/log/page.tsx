"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  addDailyActivityLogs,
  formatDateTime,
  getRoleUser,
  getTeacherDailyActivityLogs,
  getTeacherStudents,
  useDemoStore,
} from "@/lib/mock/demo-store";

type LogTab = "meals" | "nap" | "hygiene";

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function getValueForTab(tab: LogTab, opts: Record<string, string>) {
  if (tab === "meals") return `${opts.mealType} (${opts.mealAmount})`;
  if (tab === "nap") return opts.napDuration;
  return opts.hygieneType;
}

function toTitle(tab: LogTab) {
  return tab === "meals" ? "Meal" : tab === "nap" ? "Nap" : "Hygiene";
}

export default function TeacherDailyLogPage() {
  const snapshot = useDemoStore();
  const teacher = getRoleUser("teacher");
  const students = getTeacherStudents(teacher.id);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<LogTab>("meals");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [date, setDate] = useState(getTodayIsoDate());
  const [time, setTime] = useState(getCurrentTime());
  const [mealType, setMealType] = useState("AM Snack");
  const [mealAmount, setMealAmount] = useState("All");
  const [napDuration, setNapDuration] = useState("45 mins");
  const [hygieneType, setHygieneType] = useState("Toilet");
  const [details, setDetails] = useState("");

  const studentMap = useMemo(
    () => new Map(snapshot.students.map((student) => [student.id, student])),
    [snapshot.students],
  );

  const logsForDate = getTeacherDailyActivityLogs(date, teacher.id);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id],
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
      return;
    }
    setSelectedStudents(students.map((student) => student.id));
  };

  const resetForm = () => {
    setDetails("");
    setMealType("AM Snack");
    setMealAmount("All");
    setNapDuration("45 mins");
    setHygieneType("Toilet");
    setTime(getCurrentTime());
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) return;

    const value = getValueForTab(activeTab, {
      mealType,
      mealAmount,
      napDuration,
      hygieneType,
    });

    addDailyActivityLogs({
      studentIds: selectedStudents,
      date,
      time,
      activityType: activeTab,
      value,
      notes: details,
    });

    toast({
      title: "Daily activity saved",
      description: `${toTitle(activeTab)} record saved for ${selectedStudents.length} student${selectedStudents.length === 1 ? "" : "s"}.`,
    });
    resetForm();
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Daily Activity Recording
          </h1>
          <p className="text-sm text-slate-500">
            Record meals, naps, and hygiene updates for your class and keep a
            clean daily trail.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="text-xs font-medium text-slate-500">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full sm:w-[180px]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full sm:w-[140px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-slate-100 shadow-sm lg:col-span-1 flex flex-col h-[640px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h2 className="font-medium text-slate-900 text-sm">
              Select Students
            </h2>
            <Button
              variant="link"
              onClick={selectAll}
              className="text-xs font-medium text-montessori-primary p-0 h-auto"
            >
              {selectedStudents.length === students.length
                ? "Deselect All"
                : "Select All"}
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
                  <div
                    className={`w-8 h-8 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-medium text-xs`}
                  >
                    {student.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div className="text-left min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        selectedStudents.includes(student.id)
                          ? "text-montessori-primary"
                          : "text-slate-900"
                      }`}
                    >
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {student.classroom}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedStudents.includes(student.id)
                      ? "border-montessori-primary bg-montessori-primary text-white"
                      : "border-slate-300"
                  }`}
                >
                  {selectedStudents.includes(student.id) && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <p className="text-sm text-slate-600 font-medium text-center">
              {selectedStudents.length} student
              {selectedStudents.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 shadow-sm p-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as LogTab)}
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="nap">Naps</TabsTrigger>
                <TabsTrigger value="hygiene">Hygiene</TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "meals" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Meal Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["AM Snack", "Lunch", "PM Snack"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setMealType(type)}
                        className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                          mealType === type
                            ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                            : "border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Amount Eaten
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {["All", "Most", "Some", "None"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setMealAmount(amt)}
                        className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                          mealAmount === amt
                            ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                            : "border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary"
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "nap" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Nap Duration
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["30 mins", "45 mins", "60+ mins"].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setNapDuration(duration)}
                        className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                          napDuration === duration
                            ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                            : "border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary"
                        }`}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "hygiene" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Hygiene Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Toilet", "Diaper Change", "Hand Wash"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setHygieneType(type)}
                        className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                          hygieneType === type
                            ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                            : "border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px]"
                placeholder="Add context that should be visible in today’s record trail."
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={resetForm}
                className="px-6 rounded-full font-medium"
              >
                Reset
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedStudents.length === 0}
                className="px-8 rounded-full bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm"
              >
                Save Daily Record
              </Button>
            </div>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recorded Entries ({logsForDate.length})
                </h2>
                <p className="text-xs text-slate-500">{date}</p>
              </div>

              {logsForDate.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center border border-dashed rounded-xl border-slate-200">
                  No entries recorded for this date yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {logsForDate.map((log) => {
                    const student = studentMap.get(log.studentId);
                    return (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-100 p-3.5 bg-white"
                      >
                        <div className="flex flex-wrap items-center gap-2 justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold text-white ${student?.avatarColor ?? "bg-slate-400"}`}
                            >
                              {student
                                ? student.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")
                                : "?"}
                            </span>
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {student?.name ?? "Unknown student"}
                            </p>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                              {log.activityType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {log.time} · {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-slate-700">{log.value}</p>
                        {log.notes && (
                          <p className="text-xs text-slate-500 mt-1.5">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
