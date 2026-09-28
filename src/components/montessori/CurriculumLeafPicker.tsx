"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GENERAL_LEAF_PREFIX,
  generalLeafId,
  getLeafById,
  isGeneralLeafId,
  type Area,
} from "@/lib/curriculum/curriculum";
import { visibleCurriculum } from "@/lib/curriculum/school-curriculum";

const GENERAL = "__general__";

// The picker lists the school's visible nodes. When editing a record filed
// under a since-hidden node, that node's path is kept too so the current
// selection still shows (and saving unchanged doesn't move the record).
function pickerAreas(catalog: Area[], keep: Set<string>): Area[] {
  if (keep.size === 0) return visibleCurriculum(catalog);
  const shown = (n: { id: string; hidden?: boolean }) => !n.hidden || keep.has(n.id);
  return catalog.filter(shown).map((a) => ({
    ...a,
    subcategories: a.subcategories.filter(shown).map((s) => ({
      ...s,
      activities: s.activities.filter(shown).map((act) => ({
        ...act,
        variations: act.variations.filter(shown),
      })),
    })),
  }));
}

function initialSelection(catalog: Area[], initialLeafId?: string | null) {
  if (!initialLeafId) return null;
  if (isGeneralLeafId(initialLeafId)) {
    const areaId = initialLeafId.slice(GENERAL_LEAF_PREFIX.length);
    return { areaId, subcategoryId: "", activityId: GENERAL, variationId: "" };
  }
  const leaf = getLeafById(initialLeafId, catalog);
  if (!leaf) return null;
  return {
    areaId: leaf.areaId,
    subcategoryId: leaf.subcategoryId,
    activityId: leaf.activityId,
    variationId: leaf.leafId !== leaf.activityId ? leaf.leafId : "",
  };
}

// Area → activity → variation selection, resolved to the curriculum leaf an
// observation is filed under. Shared by the single-child and bulk forms and the
// edit dialogs. `catalog` is the school's FULL catalog (hidden nodes flagged);
// `initialLeafId` starts the picker on an existing record's leaf. With
// `multiple`, several variations can be ticked at once — `leafIds` then holds
// one leaf per variation (callers file one record per leaf).
export function useCurriculumLeaf(
  catalog: Area[],
  initialLeafId?: string | null,
  { multiple = false }: { multiple?: boolean } = {},
) {
  const [initial] = useState(() => initialSelection(catalog, initialLeafId));
  const areas = useMemo(
    () =>
      pickerAreas(
        catalog,
        new Set(
          initial
            ? [
                initial.areaId,
                initial.subcategoryId,
                initial.activityId,
                initial.variationId,
              ].filter(Boolean)
            : [],
        ),
      ),
    [catalog, initial],
  );
  const [areaId, setAreaId] = useState(initial?.areaId ?? areas[0]?.id ?? "");
  const area: Area | undefined = areas.find((a) => a.id === areaId) ?? areas[0];
  const flatActivities = useMemo(
    () =>
      (area?.subcategories ?? []).flatMap((sub) =>
        sub.activities.map((act) => ({ sub, act })),
      ),
    [area],
  );
  // Default to a general observation for the area; the teacher can narrow to a
  // specific activity if they want.
  const [activityId, setActivityId] = useState<string>(initial?.activityId ?? GENERAL);
  const isGeneral = activityId === GENERAL;
  const currentActivity = isGeneral
    ? undefined
    : flatActivities.find((entry) => entry.act.id === activityId);
  const variations = currentActivity?.act.variations ?? [];
  const [variationId, setVariationId] = useState<string>(initial?.variationId ?? "");
  // Multi-select: null until the teacher touches it, meaning "the first one".
  const [pickedVariations, setPickedVariations] = useState<string[] | null>(null);
  const variationIds = multiple
    ? pickedVariations === null
      ? variations.slice(0, 1).map((v) => v.id)
      : pickedVariations.filter((id) => variations.some((v) => v.id === id))
    : [];

  const leafIds = !area
    ? []
    : isGeneral
      ? [generalLeafId(area.id)]
      : !currentActivity
        ? []
        : variations.length > 0
          ? multiple
            ? variationIds
            : [variationId || variations[0].id]
          : [activityId];
  const leafId = leafIds[0] ?? "";

  return {
    areas,
    area,
    areaId: area?.id ?? "",
    activityId,
    currentActivity,
    variations,
    variationId,
    leafId,
    leafIds,
    multiple,
    variationIds,
    setArea: (value: string) => {
      setAreaId(value);
      setActivityId(GENERAL);
      setVariationId("");
      setPickedVariations(null);
    },
    setActivity: (value: string) => {
      setActivityId(value);
      setVariationId("");
      setPickedVariations(null);
    },
    setVariationId,
    setVariationIds: (ids: string[]) => setPickedVariations(ids),
  };
}

export function CurriculumLeafFields({
  picker,
}: {
  picker: ReturnType<typeof useCurriculumLeaf>;
}) {
  const { areas, area, areaId, activityId, currentActivity, variations, variationId } = picker;
  const hasVariations = variations.length > 0;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Area</label>
          <Select value={areaId} onValueChange={picker.setArea}>
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Activity</label>
          <Select value={activityId} onValueChange={picker.setActivity}>
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GENERAL}>General (whole area)</SelectItem>
              {(area?.subcategories ?? []).map((sub) => (
                <SelectGroup key={sub.id}>
                  <SelectLabel className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    {sub.name}
                  </SelectLabel>
                  {sub.activities.map((act) => (
                    <SelectItem key={act.id} value={act.id}>{act.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Variation</label>
          {picker.multiple && hasVariations ? (
            <VariationMultiSelect
              variations={variations}
              value={picker.variationIds}
              onChange={picker.setVariationIds}
            />
          ) : (
          <Select
            value={hasVariations ? variationId || variations[0].id : ""}
            onValueChange={picker.setVariationId}
            disabled={!hasVariations}
          >
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue placeholder={hasVariations ? "Select variation" : "—"} />
            </SelectTrigger>
            <SelectContent>
              {variations.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
        </div>
      </div>
      {currentActivity?.act.description && (
        <p className="text-xs text-slate-500 italic">{currentActivity.act.description}</p>
      )}
    </>
  );
}

// A select-lookalike whose list has a checkbox per variation.
function VariationMultiSelect({
  variations,
  value,
  onChange,
}: {
  variations: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chosen = new Set(value);
  const toggle = (id: string) =>
    onChange(
      variations
        .map((v) => v.id)
        .filter((vid) => (vid === id ? !chosen.has(vid) : chosen.has(vid))),
    );
  const names = variations.filter((v) => chosen.has(v.id)).map((v) => v.name);
  const label =
    names.length === 0
      ? "Select variations"
      : names.length <= 3
        ? names.join(", ")
        : `${names.length} variations`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-montessori-primary/20"
      >
        <span className={`truncate ${names.length === 0 ? "text-slate-400" : ""}`}>{label}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs">
            <button
              type="button"
              onClick={() => onChange(variations.map((v) => v.id))}
              className="font-medium text-montessori-primary hover:underline"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {variations.map((v) => (
              <label
                key={v.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100"
              >
                <Checkbox checked={chosen.has(v.id)} onCheckedChange={() => toggle(v.id)} />
                {v.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
