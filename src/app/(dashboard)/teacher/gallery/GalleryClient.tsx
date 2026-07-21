"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageIcon, Search } from "lucide-react";
import { CURRICULUM } from "@/lib/curriculum/curriculum";

export type GalleryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  studentName: string;
  areaName: string | null;
  activityName: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [areaFilter, setAreaFilter] = useState("All");
  const [search, setSearch] = useState("");

  const areasPresent = useMemo(() => {
    const present = new Set(items.map((i) => i.areaName).filter(Boolean));
    return CURRICULUM.filter((a) => present.has(a.name));
  }, [items]);

  const filtered = items.filter((i) => {
    const matchesArea = areaFilter === "All" || i.areaName === areaFilter;
    const matchesSearch =
      search === "" ||
      i.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (i.caption ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesArea && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Classroom Media</h1>
          <p className="text-sm text-slate-500">Every photo shared to parents from the activity feed.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or caption…"
            className="pl-9 border-slate-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setAreaFilter("All")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            areaFilter === "All"
              ? "bg-slate-100 text-slate-700 border-slate-300"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          All
        </button>
        {areasPresent.map((a) => (
          <button
            key={a.id}
            onClick={() => setAreaFilter(a.name)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              areaFilter === a.name
                ? `${a.tone.soft} ${a.tone.text} ${a.tone.border}`
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-20 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">
              {items.length === 0
                ? "No photos have been shared yet. Post an activity with a photo to see it here."
                : "No media matches the selected filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-montessori-primary/50 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.caption ?? "Classroom media"} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="bg-white/90 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                    {item.studentName}
                  </span>
                  {item.areaName && (
                    <span className="bg-white/90 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                      {item.areaName}
                    </span>
                  )}
                </div>
                <p className="text-white text-xs font-medium opacity-90">{formatDate(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
