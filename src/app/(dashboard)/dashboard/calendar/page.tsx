"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import {
  getCalendarEvents,
  type DemoCalendarEvent,
} from "@/lib/mock/demo-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function sameMonth(date: Date, other: Date) {
  return (
    date.getFullYear() === other.getFullYear() &&
    date.getMonth() === other.getMonth()
  );
}

function formatTimeLabel(event: DemoCalendarEvent) {
  if (event.allDay) return "All Day";

  return new Date(event.startsAt).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const events = getCalendarEvents();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(events[0]?.startsAt ?? "2026-05-01T00:00:00.000Z"),
  );
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const { toast } = useToast();
  const currentMonthEvents = events.filter((event) =>
    sameMonth(new Date(event.startsAt), currentMonth),
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
          onClick={() => setIsAddEventOpen(true)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View (Placeholder for an actual Calendar component) */}
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
              {/* Dummy Calendar Grid */}
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
                {/* Empty cells for previous month */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[120px] p-2 border-r border-b border-slate-100 bg-slate-50/50"
                  ></div>
                ))}

                {/* Days of current month */}
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
                    (event) => new Date(event.startsAt).getDate() === day,
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

                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="mt-2 truncate rounded-md px-1.5 py-1 text-[10px] font-medium bg-montessori-primary/10 text-montessori-primary"
                        >
                          {event.title}
                        </div>
                      ))}

                      <button className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors">
                        <Plus className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  );
                })}

                {/* Empty cells for next month */}
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

        {/* Upcoming Events Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h3 className="font-medium text-slate-900 text-sm">
                Upcoming Events
              </h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {events.map((event, i) => (
                  <div
                    key={i}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                        <span className="text-xs font-medium uppercase">
                          {new Date(event.startsAt).toLocaleDateString(
                            "en-NG",
                            {
                              month: "short",
                            },
                          )}
                        </span>
                        <span className="text-lg font-serif">
                          {new Date(event.startsAt).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                            },
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
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl text-center">
                <Button
                  variant="link"
                  className="text-xs text-montessori-primary font-medium h-auto p-0"
                >
                  View Full Schedule
                </Button>
              </div>
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

      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
            <DialogDescription>
              Create a new event, field trip, or holiday block.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Event Title
              </label>
              <Input
                placeholder="e.g. Science Fair"
                className="border-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Date
                </label>
                <Input type="date" className="border-slate-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Time
                </label>
                <Input type="time" className="border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Location
              </label>
              <Input
                placeholder="e.g. Room 101 or Library"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Event Type
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="bg-montessori-primary text-white h-8 px-3 text-xs"
                >
                  Academic
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-slate-600 h-8 px-3 text-xs"
                >
                  Activity
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-slate-600 h-8 px-3 text-xs"
                >
                  Holiday
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsAddEventOpen(false);
                toast({
                  title: "Event Created",
                  description: "Calendar has been updated successfully.",
                });
              }}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Save Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
