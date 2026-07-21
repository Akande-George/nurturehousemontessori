"use client";

import { useState, useTransition } from "react";
import { BookOpen, ExternalLink, FileText, Loader2, Plus, Trash2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createResource, deleteResource } from "@/lib/actions/resources";
import type { Resource } from "@/lib/db/resources";

type ResourceType = "article" | "video" | "policy";

const iconByType: Record<string, React.ReactNode> = {
  article: <FileText className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  policy: <BookOpen className="w-5 h-5" />,
};
const typeLabel: Record<ResourceType, string> = {
  article: "Article & Guide",
  video: "Curriculum Video",
  policy: "Policy",
};
const TYPES: ResourceType[] = ["article", "video", "policy"];

export function ResourcesAdminClient({ resources }: { resources: Resource[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ResourceType>("article");

  const reset = () => {
    setTitle("");
    setDescription("");
    setUrl("");
    setType("article");
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      url: url.trim() || undefined,
    };
    startTransition(async () => {
      const res = await createResource(payload);
      if (!res.ok) {
        toast({ title: "Could not add resource", description: res.error, variant: "destructive" });
        return;
      }
      reset();
      setIsOpen(false);
      toast({ title: "Resource added", description: `${payload.title} is now visible to parents.` });
    });
  };

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const res = await deleteResource(id);
      if (!res.ok) {
        toast({ title: "Could not remove resource", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Resource removed", description: `${name} is no longer shared.` });
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Resource Library</h1>
          <p className="text-sm text-slate-500">
            Publish curriculum guides, videos, and policies for parents to browse in their portal.
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </Button>
      </div>

      {resources.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              No resources yet. Add your first guide, video, or policy to share it with parents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <Card key={r.id} className="border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100">
                  {iconByType[r.type] ?? <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 border-none text-[10px] uppercase tracking-wider font-medium"
                    >
                      {typeLabel[r.type as ResourceType] ?? r.type}
                    </Badge>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-montessori-primary"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <h3 className="font-medium text-slate-900 leading-tight">{r.title}</h3>
                  {r.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(r.id, r.title)}
                  disabled={isPending}
                  aria-label="Delete resource"
                  className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Share a guide, video, or policy with the parents at your school.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? "default" : "outline"}
                    onClick={() => setType(t)}
                    className={`flex-1 capitalize ${
                      type === t
                        ? "bg-montessori-primary text-white hover:bg-montessori-primary/90"
                        : "text-slate-600"
                    }`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="res-title" className="text-sm font-medium text-slate-700">
                Title
              </label>
              <Input
                id="res-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Practical Life at Home"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="res-desc" className="text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                id="res-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary for parents."
                className="border-slate-200"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="res-url" className="text-sm font-medium text-slate-700">
                Link (optional)
              </label>
              <Input
                id="res-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="border-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !title.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
