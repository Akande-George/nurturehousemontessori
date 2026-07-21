import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import type { Tables } from "@/lib/db/types";

type CalendarEvent = Tables["calendar_events"]["Row"];

const EVENT_STYLES: Record<string, string> = {
  academic:
    "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20",
  activity: "bg-amber-100 text-amber-700 border-amber-200",
  holiday: "bg-emerald-100 text-emerald-700 border-emerald-200",
  staff: "bg-blue-100 text-blue-700 border-blue-200",
};

function eventStyle(type: string) {
  return EVENT_STYLES[type] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventTime(event: CalendarEvent) {
  if (event.all_day) return "All day";
  const start = new Date(event.starts_at).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!event.ends_at) return start;
  const end = new Date(event.ends_at).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${start} - ${end}`;
}

function groupEventsByMonth(events: CalendarEvent[]) {
  return events.reduce<Record<string, CalendarEvent[]>>((groups, event) => {
    const label = new Date(event.starts_at).toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });
    groups[label] = groups[label] ? [...groups[label], event] : [event];
    return groups;
  }, {});
}

export default async function ParentCalendarPage() {
  const { school } = await requireRole("parent");
  const supabase = await createClient();

  const { data } = school
    ? await supabase!
        .from("calendar_events")
        .select("*")
        .eq("school_id", school.id)
        .order("starts_at")
    : { data: [] as CalendarEvent[] };
  const events = (data ?? []) as CalendarEvent[];

  const now = Date.now();
  const upcomingEvents = events.filter(
    (e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now,
  );
  const nextEvent = upcomingEvents[0];
  const groupedEvents = groupEventsByMonth(events);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-1 sm:space-y-8 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Family Calendar</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            See upcoming school events, family activities, and holiday dates that
            apply to your children.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full md:w-auto">
          <Link href="/parent">
            Back to Feed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-100 shadow-sm lg:col-span-2">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-montessori-primary/10 p-3 text-montessori-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Next Event
                </p>
                <h2 className="mt-1 text-lg font-serif text-slate-900">
                  {nextEvent ? nextEvent.title : "No upcoming events"}
                </h2>
                {nextEvent && (
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {formatEventDate(nextEvent.starts_at)} ·{" "}
                      {formatEventTime(nextEvent)}
                    </p>
                    {nextEvent.location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {nextEvent.location}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Upcoming Activities
              </p>
              <p className="mt-1 text-3xl font-serif text-slate-900">
                {upcomingEvents.length}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Parent-visible events update here automatically whenever the school
              calendar changes.
            </p>
          </CardContent>
        </Card>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No upcoming calendar items are available for families right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthLabel, monthEvents]) => (
            <section key={monthLabel} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {monthLabel}
                </h2>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-4">
                {monthEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden border-slate-100 shadow-sm"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={eventStyle(event.type)}
                            >
                              {event.type}
                            </Badge>
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              {formatEventDate(event.starts_at)}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:w-64">
                          <div className="space-y-2 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400" />
                              {formatEventTime(event)}
                            </p>
                            {event.location && (
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
