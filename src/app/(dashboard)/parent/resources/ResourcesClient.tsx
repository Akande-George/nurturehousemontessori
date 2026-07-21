"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, ExternalLink, FileText, Search, Video } from "lucide-react";
import type { Resource } from "@/lib/db/resources";

type Category = "all" | "article" | "video" | "policy";

const iconByType: Record<string, React.ReactNode> = {
  article: <FileText className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  policy: <BookOpen className="w-5 h-5" />,
};
const typeLabel: Record<string, string> = {
  article: "Article & Guide",
  video: "Curriculum Video",
  policy: "Policy",
};

export function ResourcesClient({ resources }: { resources: Resource[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchCat = activeCategory === "all" || r.type === activeCategory;
      const q = search.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [resources, activeCategory, search]);

  const cats: { key: Category; label: string }[] = [
    { key: "all", label: "All Resources" },
    { key: "article", label: "Articles & Guides" },
    { key: "video", label: "Curriculum Videos" },
    { key: "policy", label: "Policies & Handbooks" },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Resource Library
          </h1>
          <p className="text-sm text-slate-500">
            Curriculum guides, school policies, and parent learning resources.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="pl-9 border-slate-200"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {cats.map((c) => (
          <Button
            key={c.key}
            variant={activeCategory === c.key ? "default" : "outline"}
            onClick={() => setActiveCategory(c.key)}
            className={`rounded-full whitespace-nowrap ${
              activeCategory === c.key
                ? "bg-montessori-primary text-white hover:bg-montessori-primary/90 border-none"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            {resources.length === 0
              ? "Your school hasn't shared any resources yet."
              : "No resources matched your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((r) => {
            const inner = (
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-montessori-primary/10 group-hover:text-montessori-primary transition-colors">
                    {iconByType[r.type] ?? <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <Badge
                      variant="secondary"
                      className="mb-2 bg-slate-100 text-slate-600 border-none text-[10px] uppercase tracking-wider font-medium"
                    >
                      {typeLabel[r.type] ?? r.type}
                    </Badge>
                    <h3 className="font-serif text-lg text-slate-900 leading-tight group-hover:text-montessori-primary transition-colors">
                      {r.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">
                  {r.description}
                </p>
                {r.url && (
                  <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-auto">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 group-hover:text-montessori-primary">
                      Open <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </CardContent>
            );
            const cardClass =
              "border-slate-100 shadow-sm hover:border-montessori-primary/40 transition-colors group h-full flex flex-col";
            return r.url ? (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block">
                <Card className={`${cardClass} cursor-pointer`}>{inner}</Card>
              </a>
            ) : (
              <Card key={r.id} className={cardClass}>
                {inner}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
