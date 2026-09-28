"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/actions/operations";
import type { CalendarEvent } from "@/lib/db/operations";

function sameMonth(date: Date, other: Date) {
  return (
    date.getFullYear() === other.getFullYear() &&
    date.getMonth() === other.getMonth()
  );
}

function formatTimeLabel(event: CalendarEvent) {
  if (event.all_day) return "All Day";
  return new Date(event.starts_at).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const EVENT_TYPES = ["academic", "activity", "holiday"] as const;
type EventType = (typeof EVENT_TYPES)[number];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Local YYYY-MM-DD / HH:MM for the date and time inputs (the form builds
// starts_at from local time, so it must be read back the same way).
function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(events[0]?.starts_at ?? new Date().toISOString()),
  );
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  // The event being edited; null while the dialog is creating a new one.
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>("academic");

  const currentMonthEvents = events.filter((event) =>
    sameMonth(new Date(event.starts_at), currentMonth),
  );
  const firstDayOffset = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const trailingDays = (7 - ((firstDayOffset + daysInMonth) % 7)) % 7;

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setDescription("");
    setType("academic");
  };

  const openCreate = (day?: Date) => {
    resetForm();
    if (day) setDate(toDateInput(day));
    setIsAddEventOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    const startsAt = new Date(event.starts_at);
    setEditing(event);
    setTitle(event.title);
    setDate(toDateInput(startsAt));
    setTime(event.all_day ? "" : toTimeInput(startsAt));
    setLocation(event.location ?? "");
    setDescription(event.description ?? "");
    setType(
      (EVENT_TYPES as readonly string[]).includes(event.type)
        ? (event.type as EventType)
        : "academic",
    );
    setIsAddEventOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !date) {
      toast({
        title: "Add a title and a date",
        variant: "destructive",
      });
      return;
    }
    const startsAt = time
      ? new Date(`${date}T${time}`).toISOString()
      : new Date(`${date}T00:00:00`).toISOString();
    start(async () => {
      let res: { ok: boolean; error?: string };
      if (editing) {
        // The form has no end time: keep an existing event's duration by
        // moving its end along with the new start.
        const endsAt = editing.ends_at
          ? new Date(
              new Date(startsAt).getTime() +
                (new Date(editing.ends_at).getTime() -
                  new Date(editing.starts_at).getTime()),
            ).toISOString()
          : null;
        res = await updateCalendarEvent(editing.id, {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          startsAt,
          endsAt,
          type,
          allDay: !time,
        });
      } else {
        res = await createCalendarEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startsAt,
          type,
          allDay: !time,
        });
      }
      if (res.ok) {
        setIsAddEventOpen(false);
        toast({
          title: editing ? "Event Updated" : "Event Created",
          description: "Calendar has been updated successfully.",
        });
        resetForm();
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!editing) return;
    if (!window.confirm(`Delete "${editing.title}"? This can't be undone.`))
      return;
    const eventId = editing.id;
    start(async () => {
      const res = await deleteCalendarEvent(eventId);
      if (res.ok) {
        setIsAddEventOpen(false);
        resetForm();
        toast({ title: "Event Deleted" });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            School Calendar
          </h1>
          <p className="text-sm text-slate-500">
            Manage school events, holidays, and term schedules.
          </p>
        </div>

        <Button
          onClick={() => openCreate()}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-montessori-primary" />
                {currentMonth.toLocaleDateString("en-NG", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-slate-600"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 font-medium"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-slate-600"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-7 bg-white">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[120px] p-2 border-r border-b border-slate-100 bg-slate-50/50"
                  ></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const calendarDate = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day,
                  );
                  const today = new Date();
                  const isToday =
                    calendarDate.getFullYear() === today.getFullYear() &&
                    calendarDate.getMonth() === today.getMonth() &&
                    calendarDate.getDate() === today.getDate();
                  const dayEvents = currentMonthEvents.filter(
                    (event) => new Date(event.starts_at).getDate() === day,
                  );

                  return (
                    <div
                      key={day}
                      className={`min-h-[120px] p-2 border-r border-b border-slate-100 relative group transition-colors hover:bg-slate-50 ${isToday ? "bg-montessori-primary/5" : ""}`}
                    >
                      <div
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday ? "bg-montessori-primary text-white font-medium shadow-sm" : "text-slate-700"}`}
                      >
                        {day}
                      </div>

                      <button
                        onClick={() => openCreate(calendarDate)}
                        aria-label="Add event on this day"
                        className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
                      >
                        <Plus className="w-5 h-5 text-slate-600" />
                      </button>

                      {/* Event chips sit above the add-overlay; click to edit. */}
                      {dayEvents.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => openEdit(event)}
                          title={`Edit ${event.title}`}
                          className="relative z-10 mt-2 block w-full truncate text-left rounded-md px-1.5 py-1 text-[10px] font-medium bg-montessori-primary/10 text-montessori-primary hover:bg-montessori-primary/20"
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="relative z-10 mt-1 text-[10px] text-slate-500 pointer-events-none">
                          +{dayEvents.length - 2} more
                        </p>
                      )}
                    </div>
                  );
                })}

                {Array.from({ length: trailingDays }).map((_, i) => (
                  <div
                    key={`empty-next-${i}`}
                    className="min-h-[120px] p-2 border-r border-b border-slate-100 bg-slate-50/50"
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h3 className="font-medium text-slate-900 text-sm">
                Upcoming Events
              </h3>
            </div>
            <CardContent className="p-0">
              {events.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 text-center">
                  No events scheduled yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEdit(event)}
                      className="block w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                          <span className="text-xs font-medium uppercase">
                            {new Date(event.starts_at).toLocaleDateString(
                              "en-NG",
                              { month: "short" },
                            )}
                          </span>
                          <span className="text-lg font-serif">
                            {new Date(event.starts_at).toLocaleDateString(
                              "en-NG",
                              { day: "numeric" },
                            )}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm truncate group-hover:text-montessori-primary transition-colors">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{" "}
                              {formatTimeLabel(event)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-montessori-earth/10 border-montessori-earth/20 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/60 text-montessori-earth">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-medium text-slate-900">
                  Parent Synchronization
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Events marked as &quot;Public&quot; will automatically appear on
                the Parent Portal notice board and sync with their connected
                family calendars.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={isAddEventOpen}
        onOpenChange={(open) => {
          setIsAddEventOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Event" : "Add Calendar Event"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details or remove this event from the calendar."
                : "Create a new event, field trip, or holiday block."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Event Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Fair"
                className="border-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Time
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room 101 or Library"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details for staff and parents"
                className="border-slate-200 min-h-20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Event Type
              </label>
              <div className="flex gap-2">
                {EVENT_TYPES.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? "default" : "outline"}
                    onClick={() => setType(t)}
                    className={`h-8 px-3 text-xs capitalize ${type === t ? "bg-montessori-primary text-white" : "text-slate-600"}`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {editing && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={pending}
                className="sm:mr-auto gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsAddEventOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {editing ? "Save Changes" : "Save Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
