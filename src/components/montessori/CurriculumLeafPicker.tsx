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
import { CURRICULUM, generalLeafId } from "@/lib/curriculum/curriculum";

const GENERAL = "__general__";

// Area → activity → variation selection, resolved to the curriculum leaf an
// observation is filed under. Shared by the single-child and bulk forms.
export function useCurriculumLeaf() {
  const [areaId, setAreaId] = useState(CURRICULUM[0].id);
  const area = CURRICULUM.find((a) => a.id === areaId) ?? CURRICULUM[0];
  const flatActivities = useMemo(
    () => area.subcategories.flatMap((sub) => sub.activities.map((act) => ({ sub, act }))),
    [area],
  );
  // Default to a general observation for the area; the teacher can narrow to a
  // specific activity if they want.
  const [activityId, setActivityId] = useState<string>(GENERAL);
  const isGeneral = activityId === GENERAL;
  const currentActivity = isGeneral
    ? undefined
    : flatActivities.find((entry) => entry.act.id === activityId);
  const variations = currentActivity?.act.variations ?? [];
  const [variationId, setVariationId] = useState<string>("");

  const leafId = isGeneral
    ? generalLeafId(areaId)
    : variations.length > 0
      ? variationId || variations[0].id
      : activityId;

  return {
    area,
    areaId,
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
  const { area, areaId, activityId, currentActivity, variations, variationId } = picker;
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
              {CURRICULUM.map((a) => (
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
              {area.subcategories.map((sub) => (
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
