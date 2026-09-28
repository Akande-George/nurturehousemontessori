"use client";

import { useMemo, useState } from "react";
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
// `initialLeafId` starts the picker on an existing record's leaf.
export function useCurriculumLeaf(catalog: Area[], initialLeafId?: string | null) {
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

  const leafId = !area
    ? ""
    : isGeneral
      ? generalLeafId(area.id)
      : !currentActivity
        ? ""
        : variations.length > 0
          ? variationId || variations[0].id
          : activityId;

  return {
    areas,
    area,
    areaId: area?.id ?? "",
    activityId,
    currentActivity,
    variations,
    variationId,
    leafId,
    setArea: (value: string) => {
      setAreaId(value);
      setActivityId(GENERAL);
      setVariationId("");
    },
    setActivity: (value: string) => {
      setActivityId(value);
      setVariationId("");
    },
    setVariationId,
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
        </div>
      </div>
      {currentActivity?.act.description && (
        <p className="text-xs text-slate-500 italic">{currentActivity.act.description}</p>
      )}
    </>
  );
}
