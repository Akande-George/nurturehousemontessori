"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Search,
  Video,
} from "lucide-react";

type ResourceType = "article" | "video" | "policy";
type ResourceCategory = "all" | "articles" | "videos" | "policies";

type ResourceItem = {
  id: number;
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  tag: string;
  meta: string;
};

const resources: ResourceItem[] = [
  {
    id: 1,
    title: "Montessori at Home: Practical Life for Ilorin Families",
    description:
      "Simple routines you can use at home: pouring work, table setting, shoe care, and self-dressing practice.",
    type: "article",
    category: "articles",
    tag: "Parent Guide",
    meta: "6 min read",
  },
  {
    id: 2,
    title: "Language Development in the Primary Years",
    description:
      "How our teachers move children from sound games and sandpaper letters to independent reading and writing.",
    type: "video",
    category: "videos",
    tag: "Curriculum Video",
    meta: "11 min watch",
  },
  {
    id: 3,
    title: "Parent and Student Handbook (2026 Edition)",
    description:
      "Official school guidelines including attendance, uniforms, communication channels, and safeguarding policy.",
    type: "policy",
    category: "policies",
    tag: "Official Policy",
    meta: "PDF download",
  },
  {
    id: 4,
    title: "Supporting Numeracy with Everyday Activities",
    description:
      "Use shopping lists, cooking measurements, and household sorting games to build mathematical confidence.",
    type: "article",
    category: "articles",
    tag: "Math at Home",
    meta: "7 min read",
  },
  {
    id: 5,
    title: "Grace and Courtesy in the Classroom",
    description:
      "A walkthrough of how social lessons are introduced and reinforced from Nurture Bloomers through Nurture Explorers.",
    type: "video",
    category: "videos",
    tag: "Classroom Culture",
    meta: "9 min watch",
  },
  {
    id: 6,
    title: "Health and Allergy Safety Procedures",
    description:
      "Reference document for medication handling, lunchbox guidance, and emergency response expectations.",
    type: "policy",
    category: "policies",
    tag: "Safety",
    meta: "PDF download",
  },
];

const iconByType: Record<ResourceType, React.ReactNode> = {
  article: <FileText className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  policy: <BookOpen className="w-5 h-5" />,
};

export default function ResourceLibraryPage() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>("all");
  const [search, setSearch] = useState("");

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchCategory =
        activeCategory === "all" || resource.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        resource.title.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q) ||
        resource.tag.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

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

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          onClick={() => setActiveCategory("all")}
          className={`rounded-full ${
            activeCategory === "all"
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Resources
        </Button>
        <Button
          variant={activeCategory === "articles" ? "default" : "outline"}
          onClick={() => setActiveCategory("articles")}
          className={`rounded-full ${
            activeCategory === "articles"
              ? "bg-montessori-primary text-white hover:bg-montessori-primary/90 border-none"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Articles & Guides
        </Button>
        <Button
          variant={activeCategory === "videos" ? "default" : "outline"}
          onClick={() => setActiveCategory("videos")}
          className={`rounded-full ${
            activeCategory === "videos"
              ? "bg-montessori-secondary text-white hover:bg-montessori-secondary/90 border-none"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Curriculum Videos
        </Button>
        <Button
          variant={activeCategory === "policies" ? "default" : "outline"}
          onClick={() => setActiveCategory("policies")}
          className={`rounded-full ${
            activeCategory === "policies"
              ? "bg-slate-900 text-white hover:bg-slate-800 border-none"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Policies & Handbooks
        </Button>
      </div>

      {filteredResources.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No resources matched your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map((resource) => (
            <Card
              key={resource.id}
              className="border-slate-100 shadow-sm hover:border-montessori-primary/40 transition-colors group cursor-pointer h-full flex flex-col"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-montessori-primary/10 group-hover:text-montessori-primary group-hover:border-montessori-primary/20 transition-colors">
                    {iconByType[resource.type]}
                  </div>
                  <div>
                    <Badge
                      variant="secondary"
                      className="mb-2 bg-slate-100 hover:bg-slate-100 text-slate-600 border-none text-[10px] uppercase tracking-wider font-medium"
                    >
                      {resource.tag}
                    </Badge>
                    <h3 className="font-serif text-lg text-slate-900 leading-tight group-hover:text-montessori-primary transition-colors">
                      {resource.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-xs font-medium text-slate-400">
                    {resource.meta}
                  </span>

                  {resource.type === "policy" ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 group-hover:text-montessori-primary">
                      <Download className="w-3.5 h-3.5" /> Download
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 group-hover:text-montessori-primary">
                      Open <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
