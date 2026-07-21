"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, Heart } from "lucide-react";
import { CURRICULUM, type Leaf } from "@/lib/curriculum/curriculum";
import { toggleActivityLike } from "@/lib/actions/montessori";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/db/types";

export type FeedPost = {
  id: string;
  student_id: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  leaf: Leaf | null;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("");
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function groupByDate(posts: FeedPost[]) {
  const groups: { label: string; key: string; posts: FeedPost[] }[] = [];
  const seen = new Map<string, number>();
  for (const post of posts) {
    const key = new Date(post.created_at).toDateString();
    if (seen.has(key)) groups[seen.get(key)!].posts.push(post);
    else {
      seen.set(key, groups.length);
      groups.push({ label: formatDateLabel(post.created_at), key, posts: [post] });
    }
  }
  return groups;
}

export function ParentFeedClient({
  children,
  posts,
  parentFirstName,
}: {
  children: Student[];
  posts: FeedPost[];
  parentFirstName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, start] = useTransition();

  const [activeChildId, setActiveChildId] = useState<string>(
    children.length > 1 ? "__all__" : children[0]?.id ?? "",
  );
  const [feedFilter, setFeedFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const childMap = useMemo(() => new Map(children.map((c) => [c.id, c])), [children]);

  const availableDates = useMemo(() => {
    const dateSet = new Set(posts.map((p) => new Date(p.created_at).toDateString()));
    return Array.from(dateSet);
  }, [posts]);

  const feedAreas = useMemo(() => {
    const present = new Set(posts.map((p) => p.leaf?.areaName).filter(Boolean));
    return CURRICULUM.filter((a) => present.has(a.name));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (activeChildId !== "__all__" && activeChildId) list = list.filter((p) => p.student_id === activeChildId);
    if (feedFilter !== "All") list = list.filter((p) => p.leaf?.areaName === feedFilter);
    if (dateFilter !== "all") list = list.filter((p) => new Date(p.created_at).toDateString() === dateFilter);
    return list;
  }, [posts, activeChildId, feedFilter, dateFilter]);

  const timelineGroups = useMemo(() => groupByDate(filteredPosts), [filteredPosts]);

  const onToggleLike = (postId: string) => {
    start(async () => {
      const res = await toggleActivityLike(postId);
      if (res.ok) router.refresh();
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  if (!children.length) {
    return <div className="py-12 text-center text-slate-500">No children found for this account.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">
          {children.length === 1 ? `${children[0].name}'s Feed` : `${parentFirstName}'s Family Feed`}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Every school moment, in one place.</p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveChildId("__all__")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
              activeChildId === "__all__"
                ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All children
          </button>
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setActiveChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                activeChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className={`w-5 h-5 rounded-full ${child.avatar_color} text-white flex items-center justify-center text-[10px] font-bold`}>
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <h2 className="text-xl font-serif text-slate-900">Activity Timeline</h2>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFeedFilter("All")}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  feedFilter === "All"
                    ? "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                All
              </button>
              {feedAreas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setFeedFilter(a.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                    feedFilter === a.name
                      ? `${a.tone.soft} ${a.tone.text} ${a.tone.border}`
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            {availableDates.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => setDateFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                    dateFilter === "all"
                      ? "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  All dates
                </button>
                {availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDateFilter(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                      dateFilter === d
                        ? "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {formatDateLabel(new Date(d).toISOString())}
                  </button>
                ))}
              </div>
            )}
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
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-2">{group.label}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="space-y-6">
                  {group.posts.map((post) => {
                    const child = childMap.get(post.student_id);
                    return (
                      <Card key={post.id} className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-50">
                          <div className={`w-9 h-9 rounded-full ${child?.avatar_color ?? "bg-slate-300"} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                            {child ? initials(child.name) : "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{child?.name}</p>
                            <p className="text-xs text-slate-500">
                              {child?.classroom ?? "—"} ·{" "}
                              {new Date(post.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {post.leaf && (
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium shrink-0 ${post.leaf.areaTone.soft} ${post.leaf.areaTone.text} ${post.leaf.areaTone.border}`}
                            >
                              {post.leaf.areaName} · {post.leaf.activityName}
                            </Badge>
                          )}
                        </div>
                        {post.image_url && (
                          <div className="relative w-full aspect-video bg-slate-100">
                            <Image
                              src={post.image_url}
                              alt={`${child?.name ?? "Child"} — ${post.leaf?.activityName ?? "activity"}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 800px"
                              unoptimized
                            />
                          </div>
                        )}
                        <CardContent className="p-5 space-y-3">
                          <p className="text-sm text-slate-700 leading-relaxed">{post.caption}</p>
                          <button
                            onClick={() => onToggleLike(post.id)}
                            className="flex items-center gap-2 group"
                            aria-label={post.liked_by_me ? "Unlike" : "Like"}
                          >
                            <Heart
                              className={`w-5 h-5 transition-all duration-150 ${
                                post.liked_by_me ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-400"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium transition-colors ${
                                post.liked_by_me ? "text-rose-500" : "text-slate-500 group-hover:text-rose-400"
                              }`}
                            >
                              {post.like_count} {post.like_count === 1 ? "like" : "likes"}
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
