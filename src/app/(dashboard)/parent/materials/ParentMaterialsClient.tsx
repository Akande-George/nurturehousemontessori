"use client";

import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Presentation,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_KIND_LABELS,
  MATERIAL_KIND_TONES,
  formatFileSize,
  isMaterialCategory,
  materialHref,
  materialKind,
  opensInline,
  type MaterialKind,
} from "@/lib/materials";

type ChildLite = { id: string; name: string; avatar_color: string };

type MaterialLite = {
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

export function ParentMaterialsClient({
  childrenList,
  materials,
}: {
  childrenList: ChildLite[];
  materials: MaterialLite[];
}) {
  const [selectedId, setSelectedId] = useState(childrenList[0]?.id ?? "");
  const child = childrenList.find((c) => c.id === selectedId);
  const visible = useMemo(
    () => materials.filter((m) => m.studentId === selectedId),
    [materials, selectedId],
  );

  if (childrenList.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-slate-500">
        No children linked to your account yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="font-serif text-2xl text-slate-900">Child Materials</h1>
        <p className="text-sm text-slate-500">
          Documents your child&apos;s teacher has shared just for them —
          worksheets, assessments and plans for home. These are private to your
          family; the Resource Library holds what the whole school sees.
        </p>
      </div>

      {childrenList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {childrenList.map((c) => {
            const count = materials.filter((m) => m.studentId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  c.id === selectedId
                    ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${c.avatar_color}`}
                >
                  {initials(c.name)}
                </span>
                {c.name.split(" ")[0]}
                {count > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-500">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FolderOpen className="h-6 w-6" />
          </div>
          <p className="mx-auto max-w-xs text-sm text-slate-500">
            Nothing shared for {child?.name.split(" ")[0] ?? "your child"} yet.
            Anything their teacher sends will appear here.
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
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                      {m.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {opensInline(m.fileExt) && (
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <a
                          href={materialHref(m.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                      </Button>
                    )}
                    <Button
                      asChild
                      size="sm"
                      className="gap-1.5 bg-montessori-primary text-white hover:bg-montessori-primary/90"
                    >
                      <a href={materialHref(m.id, true)}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
