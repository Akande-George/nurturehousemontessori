"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  getActivityFeedForParent,
  getUpcomingParentCalendarEvents,
  getParentNotices,
  getRoleUser,
  getStudentInvoices,
  getStudentsForParent,
  toggleActivityLike,
  useDemoStore,
} from "@/lib/mock/demo-store";
import {
  Calendar,
  Bell,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Moon,
  Sun,
  UtensilsCrossed,
  BedDouble,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Practical Life": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Sensorial: "bg-violet-100 text-violet-700 border-violet-200",
  Language: "bg-sky-100 text-sky-700 border-sky-200",
  "Language Arts": "bg-sky-100 text-sky-700 border-sky-200",
  Mathematics: "bg-amber-100 text-amber-700 border-amber-200",
  Cultural: "bg-rose-100 text-rose-700 border-rose-200",
  Art: "bg-pink-100 text-pink-700 border-pink-200",
  Outdoor: "bg-lime-100 text-lime-700 border-lime-200",
  Music: "bg-orange-100 text-orange-700 border-orange-200",
  "Circle Time": "bg-teal-100 text-teal-700 border-teal-200",
  General: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Post = ReturnType<typeof getActivityFeedForParent>[number];

type RoutineStep = {
  id: "breakfast" | "nap" | "lunch" | "sleep";
  label: string;
  time: string;
  note: string;
  icon: typeof Sun;
};

function groupByDate(posts: Post[]) {
  const groups: { label: string; key: string; posts: Post[] }[] = [];
  const seen = new Map<string, number>();
  for (const post of posts) {
    const key = new Date(post.createdAt).toDateString();
    if (seen.has(key)) {
      groups[seen.get(key)!].posts.push(post);
    } else {
      seen.set(key, groups.length);
      groups.push({
        label: formatDateLabel(post.createdAt),
        key,
        posts: [post],
      });
    }
  }
  return groups;
}

export default function ParentDashboardPage() {
  const snapshot = useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);
  const notices = getParentNotices();
  const upcomingEvents = getUpcomingParentCalendarEvents(3);

  const [activeChildId, setActiveChildId] = useState<string>(
    children.length > 1 ? "__all__" : (children[0]?.id ?? ""),
  );
  const [feedFilter, setFeedFilter] = useState("All");

  const allFeedPosts = getActivityFeedForParent(parent.id);

  const filteredPosts = useMemo(() => {
    let posts = allFeedPosts;
    if (activeChildId !== "__all__" && activeChildId)
      posts = posts.filter((p) => p.studentId === activeChildId);
    if (feedFilter !== "All")
      posts = posts.filter((p) => p.category === feedFilter);
    return posts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, activeChildId, feedFilter]);

  const activeChild = children.find((c) => c.id === activeChildId);
  const invoices = activeChild ? getStudentInvoices(activeChild.id) : [];
  const unpaidInvoice = invoices.find((i) => i.status === "unpaid");

  const allUnpaid = useMemo(
    () =>
      activeChildId === "__all__"
        ? children.flatMap((c) =>
            getStudentInvoices(c.id).filter((i) => i.status === "unpaid"),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, activeChildId],
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(allFeedPosts.map((p) => p.category)))],
    [allFeedPosts],
  );

  const timelineGroups = useMemo(
    () => groupByDate(filteredPosts),
    [filteredPosts],
  );

  const flowChild = activeChildId === "__all__" ? children[0] : activeChild;
  const dayFlowSteps: RoutineStep[] = [
    {
      id: "breakfast",
      label: "Breakfast",
      time: "08:15 AM",
      note: `${flowChild?.name.split(" ")[0] ?? "Child"} had a balanced breakfast and started the morning calmly.`,
      icon: Sun,
    },
    {
      id: "nap",
      label: "Nap",
      time: "11:45 AM",
      note: "Settled quickly after story time and rested well.",
      icon: Moon,
    },
    {
      id: "lunch",
      label: "Lunch",
      time: "01:00 PM",
      note: "Ate independently and enjoyed fruit and rice.",
      icon: UtensilsCrossed,
    },
    {
      id: "sleep",
      label: "Sleep",
      time: "03:15 PM",
      note: "Quiet sleep block before pickup activities and reflection circle.",
      icon: BedDouble,
    },
  ];

  const hour = new Date().getHours();
  const defaultFlowIndex = hour < 10 ? 0 : hour < 13 ? 1 : hour < 15 ? 2 : 3;
  const [activeFlowStep, setActiveFlowStep] = useState<RoutineStep["id"]>(
    dayFlowSteps[defaultFlowIndex].id,
  );
  const activeFlowIndex = Math.max(
    dayFlowSteps.findIndex((step) => step.id === activeFlowStep),
    0,
  );

  if (!children.length) {
    return (
      <div className="py-12 text-center text-slate-500">
        No children found for this account.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">
            {children.length === 1
              ? `${children[0].name}'s Feed`
              : `${parent.name.split(" ")[0]}'s Family Feed`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nurture House Montessori — every school moment, in one place.
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-white border-slate-200 gap-2 shrink-0"
        >
          <MessageCircle className="w-4 h-4" /> Message Teacher
        </Button>
      </div>

      {/* Child switcher */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveChildId("__all__")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${activeChildId === "__all__" ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            All children
          </button>
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setActiveChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${activeChildId === child.id ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              <div
                className={`w-5 h-5 rounded-full ${child.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(activeChildId === "__all__"
          ? children
          : children.filter((c) => c.id === activeChildId)
        ).map((child) => (
          <Card key={child.id} className="border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-full ${child.avatarColor} text-white flex items-center justify-center font-bold text-sm`}
                >
                  {child.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{child.name}</p>
                  <p className="text-xs text-slate-500">
                    {child.classroom} · {child.ageGroup}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrolled</span>
                  <span className="text-slate-700">
                    {new Date(child.enrollmentDate).toLocaleDateString(
                      "en-NG",
                      { month: "short", year: "numeric" },
                    )}
                  </span>
                </div>
                {child.allergies.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allergy</span>
                    <span className="text-amber-700 font-medium">
                      {child.allergies.join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency</span>
                  <span className="text-slate-700">
                    {child.emergencyContact.name}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Single child: unpaid invoice */}
        {activeChildId !== "__all__" && unpaidInvoice && (
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between gap-4 min-h-[140px]">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                  Payment Due
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {unpaidInvoice.description}
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {formatCurrency(unpaidInvoice.amountCents)} · due{" "}
                  {unpaidInvoice.dueDate}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90 w-full"
              >
                <Link href={`/invoice/${unpaidInvoice.id}`}>Open Invoice</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All children: unpaid summary */}
        {activeChildId === "__all__" && allUnpaid.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between gap-3 min-h-[140px]">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                  {allUnpaid.length} Invoice{allUnpaid.length > 1 ? "s" : ""}{" "}
                  Due
                </p>
                {allUnpaid.map((inv) => (
                  <p key={inv.id} className="text-xs text-slate-700 mb-1">
                    {formatCurrency(inv.amountCents)} — {inv.description}
                  </p>
                ))}
              </div>
              <Button
                asChild
                size="sm"
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90 w-full"
              >
                <Link href={`/invoice/${allUnpaid[0].id}`}>View Invoice</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notice */}
        {notices[0] && (
          <Card className="border-slate-100 shadow-sm bg-slate-50/60">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notice
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {notices[0].title}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {notices[0].content}
              </p>
              <Link
                href="/parent/notices"
                className="text-xs text-montessori-primary font-medium hover:underline"
              >
                View all notices →
              </Link>
            </CardContent>
          </Card>
        )}

        {upcomingEvents.length > 0 && (
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-montessori-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Upcoming Activities
                  </p>
                </div>
                <Link
                  href="/parent/calendar"
                  className="text-xs font-medium text-montessori-primary hover:underline"
                >
                  View calendar →
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {event.title}
                    </p>
                    <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(event.startsAt).toLocaleDateString("en-NG", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {event.allDay
                          ? " · All day"
                          : ` · ${new Date(event.startsAt).toLocaleTimeString(
                              "en-NG",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Live Day Flow */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div>
              <h2 className="text-lg font-serif text-slate-900">
                Live Daily Flow
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {flowChild
                  ? `${flowChild.name.split(" ")[0]}'s routine updates`
                  : "Routine updates"}{" "}
                · Tap a step to view details.
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-white text-xs border-emerald-200 text-emerald-700 animate-pulse"
            >
              Live now
            </Badge>
          </div>

          <div className="relative">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-montessori-primary to-emerald-400 transition-all duration-700"
                style={{
                  width: `${((activeFlowIndex + 1) / dayFlowSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {dayFlowSteps.map((step, index) => {
                const StepIcon = step.icon;
                const status =
                  index < activeFlowIndex
                    ? "done"
                    : index === activeFlowIndex
                      ? "current"
                      : "upcoming";
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveFlowStep(step.id)}
                    className={`text-left rounded-xl border p-3 transition-all duration-300 ${
                      activeFlowStep === step.id
                        ? "border-montessori-primary bg-montessori-primary/5 shadow-sm scale-[1.02]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${status === "done" ? "bg-emerald-100 text-emerald-700" : status === "current" ? "bg-montessori-primary/15 text-montessori-primary animate-pulse" : "bg-slate-100 text-slate-500"}`}
                      >
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide ${status === "done" ? "text-emerald-600" : status === "current" ? "text-montessori-primary" : "text-slate-400"}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.time}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-500 animate-in fade-in">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Moment Detail
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {dayFlowSteps[activeFlowIndex].note}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button className="px-2.5 py-1 text-xs rounded-full bg-rose-50 text-rose-600 border border-rose-100 hover:scale-105 transition-transform">
                Loved this update
              </button>
              <button className="px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-600 border border-amber-100 hover:scale-105 transition-transform">
                So proud
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-xl font-serif text-slate-900">
            Activity Timeline
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFeedFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  feedFilter === cat
                    ? (CATEGORY_COLORS[cat] ??
                      "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20")
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <Card className="border-dashed border-slate-200 shadow-none">
            <CardContent className="py-16 text-center text-sm text-slate-500">
              No posts match the selected filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {timelineGroups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-2">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="space-y-6">
                  {group.posts.map((post) => {
                    const child = snapshot.students.find(
                      (s) => s.id === post.studentId,
                    );
                    return (
                      <Card
                        key={post.id}
                        className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-50">
                          <div
                            className={`w-9 h-9 rounded-full ${child?.avatarColor ?? "bg-slate-300"} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                          >
                            {child?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("") ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {child?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {child?.classroom} ·{" "}
                              {new Date(post.createdAt).toLocaleTimeString(
                                "en-NG",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium shrink-0 ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.General}`}
                          >
                            {post.category}
                          </Badge>
                        </div>
                        <div className="relative w-full aspect-video bg-slate-100">
                          <Image
                            src={post.imageUrl}
                            alt={`${child?.name ?? "Child"} — ${post.category}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                        <CardContent className="p-5 space-y-3">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {post.caption}
                          </p>
                          <button
                            onClick={() => toggleActivityLike(post.id)}
                            className="flex items-center gap-2 group"
                            aria-label={post.likedByParent ? "Unlike" : "Like"}
                          >
                            <Heart
                              className={`w-5 h-5 transition-all duration-150 ${post.likedByParent ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-400"}`}
                            />
                            <span
                              className={`text-sm font-medium transition-colors ${post.likedByParent ? "text-rose-500" : "text-slate-500 group-hover:text-rose-400"}`}
                            >
                              {post.likes} {post.likes === 1 ? "like" : "likes"}
                            </span>
                          </button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
