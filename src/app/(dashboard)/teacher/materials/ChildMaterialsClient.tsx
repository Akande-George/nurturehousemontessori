"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Presentation,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createChildMaterial,
  deleteChildMaterial,
  updateChildMaterial,
} from "@/lib/actions/childMaterials";
import {
  MATERIAL_ACCEPT,
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_KIND_LABELS,
  MATERIAL_KIND_TONES,
  MAX_MATERIAL_BYTES,
  fileExtension,
  formatFileSize,
  isAllowedExtension,
  isMaterialCategory,
  materialHref,
  materialKind,
  type MaterialCategory,
  type MaterialKind,
} from "@/lib/materials";

type ChildLite = { id: string; name: string; avatar_color: string };

export type MaterialLite = {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string;
  fileExt: string;
  fileSizeBytes: number | null;
  createdAt: string;
};

const KIND_ICONS: Record<MaterialKind, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  word: <FileText className="h-5 w-5" />,
  slides: <Presentation className="h-5 w-5" />,
  sheet: <FileSpreadsheet className="h-5 w-5" />,
  image: <FileImage className="h-5 w-5" />,
  text: <FileIcon className="h-5 w-5" />,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function ChildMaterialsClient({
  students,
  materials,
}: {
  students: ChildLite[];
  materials: MaterialLite[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  // Set while the dialog is editing an existing material rather than sharing a
  // new one — an edit changes the labels only, never the file itself.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("resource");

  const child = students.find((s) => s.id === selectedId);
  const visible = useMemo(
    () => materials.filter((m) => m.studentId === selectedId),
    [materials, selectedId],
  );
  const countFor = (id: string) =>
    materials.filter((m) => m.studentId === id).length;

  const reset = () => {
    setEditingId(null);
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("resource");
    if (fileInput.current) fileInput.current.value = "";
  };

  const openShare = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (m: MaterialLite) => {
    reset();
    setEditingId(m.id);
    setTitle(m.title);
    setDescription(m.description ?? "");
    setCategory(isMaterialCategory(m.category) ? m.category : "resource");
    setOpen(true);
  };

  const handleFile = (chosen: File | null) => {
    if (!chosen) {
      setFile(null);
      return;
    }
    if (!isAllowedExtension(fileExtension(chosen.name))) {
      toast({
        title: "That file type isn't supported",
        description: "Share a PDF, Word, slides, spreadsheet, text or image file.",
        variant: "destructive",
      });
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (chosen.size > MAX_MATERIAL_BYTES) {
      toast({
        title: "That file is too large",
        description: `${formatFileSize(chosen.size)} — the limit is 10 MB.`,
        variant: "destructive",
      });
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(chosen);
    // The filename is almost always the title the teacher wants.
    if (!title.trim()) setTitle(chosen.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = () => {
    if (!selectedId) {
      toast({ title: "Pick a child first", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Give the material a title", variant: "destructive" });
      return;
    }
    if (!editingId && !file) {
      toast({ title: "Choose a file to share", variant: "destructive" });
      return;
    }

    start(async () => {
      if (editingId) {
        const res = await updateChildMaterial({
          id: editingId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
        });
        if (!res.ok) {
          toast({
            title: res.error ?? "Could not save",
            variant: "destructive",
          });
          return;
        }
        reset();
        setOpen(false);
        toast({ title: "Material updated" });
        router.refresh();
        return;
      }

      let dataUrl: string;
      try {
        dataUrl = await fileToDataUrl(file as File);
      } catch {
        toast({ title: "Could not read that file", variant: "destructive" });
        return;
      }

      const res = await createChildMaterial({
        studentId: selectedId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        fileName: (file as File).name,
        dataUrl,
      });
      if (!res.ok) {
        toast({
          title: res.error ?? "Could not share the material",
          variant: "destructive",
        });
        return;
      }
      reset();
      setOpen(false);
      toast({
        title: "Shared",
        description: `${child?.name.split(" ")[0] ?? "The child"}'s parents can now open ${title.trim()}.`,
      });
      router.refresh();
    });
  };

  const handleDelete = (m: MaterialLite) => {
    if (
      !window.confirm(
        `Remove "${m.title}"? Parents will no longer be able to open it.`,
      )
    ) {
      return;
    }
    start(async () => {
      const res = await deleteChildMaterial(m.id);
      if (!res.ok) {
        toast({
          title: res.error ?? "Could not remove",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Material removed" });
      router.refresh();
    });
  };

  if (students.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-slate-500">
        No children assigned to you yet. Once an admin assigns your classroom
        you can share materials with each child&apos;s parents.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Child Materials</h1>
          <p className="text-sm text-slate-500">
            Share a document with one child&apos;s parents — a worksheet, an
            assessment, a plan for home. Only that child&apos;s family can open
            it.
          </p>
        </div>
        <Button
          onClick={openShare}
          className="bg-montessori-primary text-white shadow-sm hover:bg-montessori-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Share material
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {students.map((s) => {
          const count = countFor(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                s.id === selectedId
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${s.avatar_color}`}
              >
                {initials(s.name)}
              </span>
              {s.name.split(" ")[0]}
              {count > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-500">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Paperclip className="h-6 w-6" />
          </div>
          <p className="mx-auto max-w-xs text-sm text-slate-500">
            Nothing shared with {child?.name.split(" ")[0] ?? "this child"}
            &apos;s parents yet. Upload a PDF or Word document to get started.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((m) => {
            const kind = materialKind(m.fileExt);
            return (
              <li
                key={m.id}
                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${MATERIAL_KIND_TONES[kind]}`}
                >
                  {KIND_ICONS[kind]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="border-none bg-slate-100 text-[10px] font-medium uppercase tracking-wider text-slate-600"
                    >
                      {MATERIAL_CATEGORY_LABELS[
                        isMaterialCategory(m.category) ? m.category : "other"
                      ]}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {MATERIAL_KIND_LABELS[kind]} ·{" "}
                      {formatFileSize(m.fileSizeBytes)} ·{" "}
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-medium leading-tight text-slate-900">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {m.description}
                    </p>
                  )}
                  <a
                    href={materialHref(m.id, true)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-montessori-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> {m.fileName}
                  </a>
                </div>
                <button
                  onClick={() => openEdit(m)}
                  disabled={pending}
                  aria-label={`Edit ${m.title}`}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-montessori-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  disabled={pending}
                  aria-label={`Remove ${m.title}`}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit material" : "Share a material"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Changes show in the parent portal straight away. The file itself stays as it is."
                : `Only ${child?.name ?? "this child"}'s parents will be able to open this.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {!editingId && (
              <div className="space-y-2">
                <label
                  htmlFor="material-file"
                  className="text-sm font-medium text-slate-700"
                >
                  File
                </label>
                <input
                  id="material-file"
                  ref={fileInput}
                  type="file"
                  accept={MATERIAL_ACCEPT}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-lg border border-slate-200 p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700"
                />
                {file ? (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Upload className="h-3.5 w-3.5" /> {file.name} ·{" "}
                    {formatFileSize(file.size)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    PDF, Word, slides, spreadsheet, text or image. Up to 10 MB.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="material-title"
                className="text-sm font-medium text-slate-700"
              >
                Title
              </label>
              <Input
                id="material-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reading practice for half term"
                className="border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as MaterialCategory)}
              >
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {MATERIAL_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="material-desc"
                className="text-sm font-medium text-slate-700"
              >
                Note for parents
              </label>
              <Textarea
                id="material-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this is, and what to do with it at home."
                className="border-slate-200"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pending || !title.trim() || (!editingId && !file)}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save changes" : "Share with parents"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
