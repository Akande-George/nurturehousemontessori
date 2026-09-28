"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  addCurriculumNode,
  deleteCurriculumNode,
  setCurriculumNodeHidden,
  updateCurriculumNode,
} from "@/lib/actions/curriculum";
import type { Area } from "@/lib/curriculum/curriculum";
import type { CurriculumNodeKind } from "@/lib/curriculum/school-curriculum";

// One row of the tree, whatever its level.
type TreeNode = {
  id: string;
  kind: CurriculumNodeKind;
  name: string;
  description?: string;
  hidden?: boolean;
  custom?: boolean;
  children: TreeNode[];
};

const KIND_LABEL: Record<CurriculumNodeKind, string> = {
  area: "area",
  subcategory: "section",
  activity: "activity",
  variation: "variation",
};

const CHILD_KIND: Record<CurriculumNodeKind, CurriculumNodeKind | null> = {
  area: "subcategory",
  subcategory: "activity",
  activity: "variation",
  variation: null,
};

function toTree(areas: Area[]): TreeNode[] {
  return areas.map((a) => ({
    id: a.id,
    kind: "area",
    name: a.name,
    description: a.description,
    hidden: a.hidden,
    custom: a.custom,
    children: a.subcategories.map((s) => ({
      id: s.id,
      kind: "subcategory",
      name: s.name,
      description: s.description,
      hidden: s.hidden,
      custom: s.custom,
      children: s.activities.map((act) => ({
        id: act.id,
        kind: "activity",
        name: act.name,
        description: act.description,
        hidden: act.hidden,
        custom: act.custom,
        children: act.variations.map((v) => ({
          id: v.id,
          kind: "variation",
          name: v.name,
          hidden: v.hidden,
          custom: v.custom,
          children: [],
        })),
      })),
    })),
  }));
}

// Keep nodes whose name matches, or that have a matching descendant.
function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  return nodes.flatMap((n) => {
    if (n.name.toLowerCase().includes(q)) return [n];
    const children = filterTree(n.children, q);
    return children.length ? [{ ...n, children }] : [];
  });
}

type FormState =
  | { mode: "add"; kind: CurriculumNodeKind; parent: TreeNode | null }
  | { mode: "edit"; node: TreeNode };

export function CurriculumEditorClient({ curriculum }: { curriculum: Area[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const tree = useMemo(() => toTree(curriculum), [curriculum]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [removing, setRemoving] = useState<TreeNode | null>(null);

  const q = query.trim().toLowerCase();
  const shown = q ? filterTree(tree, q) : tree;
  const isOpen = (id: string) => Boolean(q) || expanded.has(id);
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openAdd = (kind: CurriculumNodeKind, parent: TreeNode | null) => {
    setForm({ mode: "add", kind, parent });
    setName("");
    setDescription("");
  };

  const openEdit = (node: TreeNode) => {
    setForm({ mode: "edit", node });
    setName(node.name);
    setDescription(node.description ?? "");
  };

  const formKind = form ? (form.mode === "add" ? form.kind : form.node.kind) : null;

  const handleSave = () => {
    if (!form || !name.trim()) return;
    start(async () => {
      const res =
        form.mode === "add"
          ? await addCurriculumNode({
              kind: form.kind,
              parentId: form.parent?.id ?? null,
              name,
              description,
            })
          : await updateCurriculumNode({
              nodeId: form.node.id,
              name,
              description: form.node.kind === "variation" ? undefined : description,
            });
      if (!res.ok) {
        toast({ title: "Could not save", description: res.error, variant: "destructive" });
        return;
      }
      if (form.mode === "add" && form.parent) {
        const parentId = form.parent.id;
        setExpanded((prev) => new Set(prev).add(parentId));
      }
      setForm(null);
      toast({
        title: form.mode === "add" ? "Added to the curriculum" : "Curriculum updated",
        description: `${name.trim()} has been saved.`,
      });
    });
  };

  const handleHidden = (node: TreeNode) => {
    start(async () => {
      const res = await setCurriculumNodeHidden({ nodeId: node.id, hidden: !node.hidden });
      if (!res.ok) {
        toast({ title: "Could not update", description: res.error, variant: "destructive" });
        return;
      }
      toast({
        title: node.hidden ? "Shown again" : "Hidden",
        description: node.hidden
          ? `${node.name} is back in pickers and progress.`
          : `${node.name} no longer appears in pickers or progress. Existing records keep it.`,
      });
    });
  };

  const handleDelete = () => {
    if (!removing) return;
    const node = removing;
    start(async () => {
      const res = await deleteCurriculumNode(node.id);
      if (!res.ok) {
        toast({ title: "Could not delete", description: res.error, variant: "destructive" });
        return;
      }
      setRemoving(null);
      toast({ title: "Deleted", description: `${node.name} was removed.` });
    });
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const childKind = CHILD_KIND[node.kind];
    const open = isOpen(node.id);
    const hasChildren = node.children.length > 0;
    return (
      <li key={node.id}>
        <div
          className={`group flex items-center gap-2 py-2 pr-3 hover:bg-slate-50 ${
            node.hidden ? "opacity-60" : ""
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {childKind ? (
            <button
              onClick={() => toggle(node.id)}
              aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
              aria-expanded={open}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
              />
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate ${
                depth === 0 ? "font-medium text-slate-900" : "text-sm text-slate-800"
              }`}
            >
              {node.name}
              {childKind && hasChildren && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  {node.children.length}
                </span>
              )}
            </p>
            {node.description && depth < 2 && (
              <p className="text-xs text-slate-500 truncate">{node.description}</p>
            )}
          </div>
          {node.custom && (
            <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-none shrink-0">
              Added
            </Badge>
          )}
          {node.hidden && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none shrink-0">
              Hidden
            </Badge>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            {childKind && (
              <button
                onClick={() => openAdd(childKind, node)}
                disabled={pending}
                aria-label={`Add a ${KIND_LABEL[childKind]} to ${node.name}`}
                title={`Add a ${KIND_LABEL[childKind]}`}
                className="p-1.5 rounded-md text-slate-400 hover:text-montessori-primary hover:bg-slate-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => openEdit(node)}
              disabled={pending}
              aria-label={`Edit ${node.name}`}
              title="Edit"
              className="p-1.5 rounded-md text-slate-400 hover:text-montessori-primary hover:bg-slate-100"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleHidden(node)}
              disabled={pending}
              aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`}
              title={node.hidden ? "Show" : "Hide"}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              {node.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            {node.custom && (
              <button
                onClick={() => setRemoving(node)}
                disabled={pending}
                aria-label={`Delete ${node.name}`}
                title="Delete"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {childKind && open && (
          <ul>
            {node.children.map((child) => renderNode(child, depth + 1))}
            {!q && node.children.length === 0 && (
              <li
                className="py-2 text-xs text-slate-400"
                style={{ paddingLeft: `${44 + (depth + 1) * 20}px` }}
              >
                No {KIND_LABEL[childKind]}s yet.
              </li>
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Curriculum</h1>
          <p className="text-sm text-slate-500">
            Rename, describe, hide or add to the areas, sections, activities and
            variations teachers record against. Built-in items can be hidden but
            not deleted.
          </p>
        </div>
        <Button
          onClick={() => openAdd("area", null)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Area
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the curriculum"
          className="pl-9 bg-white border-slate-200"
        />
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {shown.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                {q ? `Nothing matches "${query.trim()}".` : "The curriculum is empty."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shown.map((area) => renderNode(area, 0))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {form?.mode === "edit"
                ? `Edit ${KIND_LABEL[form.node.kind]}`
                : `Add ${formKind ? KIND_LABEL[formKind] : ""}`}
            </DialogTitle>
            <DialogDescription>
              {form?.mode === "add" && form.parent
                ? `Inside ${form.parent.name}.`
                : form?.mode === "edit" && !form.node.custom
                  ? "Your changes apply to this school only."
                  : form?.mode === "edit"
                    ? "Update its name and description."
                    : "A new top-level area of the curriculum."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cur-name">Name</Label>
              <Input
                id="cur-name"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                className="border-slate-200"
              />
            </div>
            {formKind !== "variation" && (
              <div className="space-y-2">
                <Label htmlFor="cur-desc">Description (optional)</Label>
                <Textarea
                  id="cur-desc"
                  value={description}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-slate-200"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending || !name.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {form?.mode === "edit" ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete {removing?.name}?</DialogTitle>
            <DialogDescription>
              This removes it and everything inside it. If children already have
              records under it, it can only be hidden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={pending}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
