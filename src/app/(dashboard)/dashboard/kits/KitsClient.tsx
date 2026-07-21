"use client";

import { useMemo, useState, useTransition } from "react";
import { Package, Download, Share2, Plus, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { downloadStructuredPdf } from "@/lib/pdf/download-pdf";
import {
  addKitItem,
  removeKitItem,
  toggleKitItemRequired,
  seedDefaultKitItems,
} from "@/lib/actions/kits";
import type { KitItem as PersistedKitItem } from "@/lib/db/resources";
import type { SchoolClass, SchoolType } from "@/lib/db/types";

type TemplateItem = { name: string; required: boolean };

type KitSection = {
  id: string;
  label: string;
  sublabel: string;
  accent: AccentKey;
  level?: number;
};

type AccentKey = "blue" | "emerald" | "amber" | "indigo" | "violet" | "rose";

const ACCENT: Record<AccentKey, { sel: string; sub: string }> = {
  blue: { sel: "bg-blue-50 border-blue-200 text-blue-800", sub: "text-blue-600/80" },
  emerald: {
    sel: "bg-emerald-50 border-emerald-200 text-emerald-800",
    sub: "text-emerald-600/80",
  },
  amber: {
    sel: "bg-amber-50 border-amber-200 text-amber-800",
    sub: "text-amber-600/80",
  },
  indigo: {
    sel: "bg-indigo-50 border-indigo-200 text-indigo-800",
    sub: "text-indigo-600/80",
  },
  violet: {
    sel: "bg-violet-50 border-violet-200 text-violet-800",
    sub: "text-violet-600/80",
  },
  rose: { sel: "bg-rose-50 border-rose-200 text-rose-800", sub: "text-rose-600/80" },
};

const ACCENT_CYCLE: AccentKey[] = [
  "blue",
  "emerald",
  "amber",
  "indigo",
  "violet",
  "rose",
];

// ---- Montessori (age-band programmes) ----

const MONTESSORI_SECTIONS: KitSection[] = [
  {
    id: "infant",
    label: "Infant Community (Nurture Bloomers)",
    sublabel: "6 months - 18 months",
    accent: "blue",
  },
  {
    id: "toddler",
    label: "Toddler Community (Nurture Buds)",
    sublabel: "18 months - 3 years",
    accent: "emerald",
  },
  {
    id: "childrensHouse",
    label: "Children's House (Nurture Explorers)",
    sublabel: "3 - 6 years",
    accent: "amber",
  },
];

const MONTESSORI_ITEMS: Record<string, TemplateItem[]> = {
  infant: [
    { name: "Soft Indoor Shoes or Grip Socks", required: true },
    { name: "Complete Changes of Clothes (x3)", required: true },
    { name: "Diapers, Wipes, and Changing Essentials", required: true },
    { name: "Comfort Item for Rest Time", required: false },
    { name: "Labelled Feeding Items / Bibs", required: true },
  ],
  toddler: [
    { name: "Indoor Shoes (Soft-soled)", required: true },
    { name: "Complete Changes of Clothes (x3)", required: true },
    { name: "Diapers/Pull-ups (if applicable)", required: true },
    { name: "Water Bottle", required: true },
    { name: "Weather-appropriate Outerwear", required: true },
  ],
  childrensHouse: [
    { name: "Indoor Slippers (Hard-soled)", required: true },
    { name: "Complete Changes of Clothes (x2)", required: true },
    { name: "Bento-style Lunchbox", required: true },
    { name: "Refillable Water Bottle", required: true },
    { name: "Muddy Buddy / Rain Gear", required: true },
    { name: "Nap Roll (for full-day students)", required: false },
  ],
};

// ---- Regular (conventional school supplies, by class/grade) ----

const REGULAR_FALLBACK_SECTIONS: KitSection[] = [
  { id: "nursery", label: "Nursery", sublabel: "Pre-primary", accent: "blue", level: 0 },
  { id: "primary", label: "Primary", sublabel: "Primary 1 – 6", accent: "emerald", level: 3 },
  {
    id: "junior-secondary",
    label: "Junior Secondary",
    sublabel: "JSS 1 – 3",
    accent: "amber",
    level: 7,
  },
];

// Build a standard Nigerian-style school supplies kit, lightly varied by level.
function regularItemsFor(level: number | undefined): TemplateItem[] {
  const lvl = level ?? 3;
  const items: TemplateItem[] = [
    { name: "Complete School Uniform × 2", required: true },
    { name: "School Sandals / Shoes (black)", required: true },
    { name: "Sports / PE Wear", required: true },
    { name: "School Bag", required: true },
    { name: "Exercise Books (2-quire) × 6", required: true },
    {
      name: "Writing Materials — pencils, biros, eraser, sharpener, 30cm ruler",
      required: true,
    },
    { name: "Set of Textbooks (per class booklist)", required: true },
    { name: "Refillable Water Bottle (labelled)", required: true },
    { name: "Lunch Box", required: true },
    { name: "Face Towel & Tissue / Wipes", required: false },
  ];
  if (lvl <= 1) {
    items.push(
      { name: "Crayons / Colouring Pencils", required: true },
      { name: "Extra Change of Clothes", required: true },
      { name: "Nap Mat", required: false },
    );
  } else if (lvl <= 6) {
    items.push(
      { name: "Crayons / Colouring Pencils", required: true },
      { name: "Mathematical Set", required: false },
    );
  } else {
    items.push(
      { name: "Mathematical Set", required: true },
      { name: "Graph / Notebook for Sciences", required: true },
      { name: "Scientific Calculator", required: false },
    );
  }
  return items;
}

export function KitsClient({
  schoolName,
  schoolType,
  classes,
  kitItems,
}: {
  schoolName: string;
  schoolType: SchoolType;
  classes: SchoolClass[];
  kitItems: PersistedKitItem[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isRegular = schoolType === "regular";
  const classesKey = classes.map((c) => c.id).join(",");

  // Sections (left rail): montessori = programmes, regular = the school's classes
  // (falling back to grade bands when the school has no classes yet).
  const sections = useMemo<KitSection[]>(() => {
    if (!isRegular) return MONTESSORI_SECTIONS;
    if (classes.length === 0) return REGULAR_FALLBACK_SECTIONS;
    return classes.map((c, i) => ({
      id: c.id,
      label: c.name,
      sublabel: `Level ${c.level}`,
      accent: ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      level: c.level,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegular, classesKey]);

  // Persisted items grouped by their section_key.
  const grouped = useMemo<Record<string, PersistedKitItem[]>>(() => {
    const next: Record<string, PersistedKitItem[]> = {};
    for (const item of kitItems) {
      (next[item.section_key] ??= []).push(item);
    }
    return next;
  }, [kitItems]);

  const [selectedId, setSelectedId] = useState<string>(sections[0]?.id ?? "");

  const effectiveId =
    selectedId && sections.some((s) => s.id === selectedId)
      ? selectedId
      : sections[0]?.id ?? "";
  const activeSection = sections.find((s) => s.id === effectiveId);
  const items = grouped[effectiveId] ?? [];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemRequired, setNewItemRequired] = useState(true);

  const kitLabel = isRegular ? "School Supplies" : "Welcome Kit";
  const railHeading = isRegular ? "Classes" : "Programmes";

  const defaultTemplate = (section: KitSection): TemplateItem[] =>
    isRegular ? regularItemsFor(section.level) : MONTESSORI_ITEMS[section.id] ?? [];

  const handleDownloadPdf = async () => {
    if (!activeSection) return;
    await downloadStructuredPdf({
      filename: `${activeSection.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-kit-list.pdf`,
      header: `${schoolName} · ${kitLabel}`,
      footer: `Generated ${new Date().toLocaleDateString("en-NG")}`,
      lines: [
        { kind: "title", text: kitLabel },
        { kind: "subtitle", text: activeSection.label },
        { kind: "rule" },
        {
          kind: "body",
          text: isRegular
            ? "Please label all books, uniform, and personal items with the pupil's full name and class. Textbooks follow the official booklist for each class."
            : "Please label every item with your child's full name. Items below help your child settle into the prepared environment with confidence.",
        },
        { kind: "spacer", size: 8 },
        {
          kind: "table",
          headers: ["Item", "Status"],
          rows: items.map((it) => [it.name, it.required ? "Required" : "Suggested"]),
        },
      ],
    });
    toast({
      title: "Kit list downloaded",
      description: `${activeSection.label} ${kitLabel.toLowerCase()} saved as PDF.`,
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !effectiveId) return;
    const name = newItemName.trim();
    const required = newItemRequired;
    startTransition(async () => {
      const res = await addKitItem({ sectionKey: effectiveId, name, required });
      if (!res.ok) {
        toast({ title: "Could not add item", description: res.error, variant: "destructive" });
        return;
      }
      setNewItemName("");
      setNewItemRequired(true);
      setIsAddOpen(false);
      toast({
        title: "Item Added",
        description: `${name} added to ${activeSection?.label ?? "the list"}.`,
      });
    });
  };

  const handleDeleteItem = (id: string) => {
    startTransition(async () => {
      const res = await removeKitItem(id);
      if (!res.ok) {
        toast({ title: "Could not remove item", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Item Removed", description: "The item has been removed from the list." });
    });
  };

  const handleToggleRequired = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleKitItemRequired(id, !current);
      if (!res.ok) {
        toast({ title: "Could not update item", description: res.error, variant: "destructive" });
      }
    });
  };

  const handleLoadDefault = () => {
    if (!activeSection) return;
    const template = defaultTemplate(activeSection);
    if (template.length === 0) return;
    startTransition(async () => {
      const res = await seedDefaultKitItems({
        sectionKey: activeSection.id,
        items: template,
      });
      if (!res.ok) {
        toast({ title: "Could not load checklist", description: res.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Default checklist loaded",
        description: `${template.length} items added to ${activeSection.label}.`,
      });
    });
  };

  const handleDistribute = () => {
    toast({
      title: "Distribute Links",
      description: `Kit list shared for ${activeSection?.label ?? "the selection"}.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            {isRegular ? "School Supplies Lists" : "School Kit Lists"}
          </h1>
          <p className="text-sm text-slate-500">
            {isRegular
              ? "Manage required books, uniform, and supplies per class and share checklists."
              : "Manage required supplies and distribute checklists."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownloadPdf} className="font-medium">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button
            onClick={handleDistribute}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm"
          >
            <Share2 className="w-4 h-4 mr-2" /> Distribute Links
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="px-1 mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {railHeading}
          </p>
          {sections.map((section) => {
            const selected = effectiveId === section.id;
            const accent = ACCENT[section.accent];
            const count = grouped[section.id]?.length ?? 0;
            return (
              <button
                key={section.id}
                onClick={() => setSelectedId(section.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  selected
                    ? accent.sel
                    : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div>
                  <p className="font-medium">{section.label}</p>
                  <p
                    className={`text-xs mt-0.5 ${selected ? accent.sub : "text-slate-500"}`}
                  >
                    {section.sublabel} · {count} item{count === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* List Content */}
        <div className="lg:col-span-3">
          <Card className="border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-slate-900">
                    {activeSection?.label ?? "—"} Requirements
                  </h2>
                  <p className="text-sm text-slate-500">
                    {items.length} total items in list
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setIsAddOpen(true)}
                disabled={isPending || !activeSection}
                className="text-montessori-primary hover:bg-montessori-primary/5 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <CardContent className="flex-1 p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-500 mb-6 max-w-xs">
                    No items in this list yet. Load the standard checklist to get started,
                    then tailor it to your needs.
                  </p>
                  {defaultTemplate(activeSection ?? sections[0]).length > 0 && (
                    <Button
                      onClick={handleLoadDefault}
                      disabled={isPending}
                      className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      Load default checklist
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white" />
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleRequired(item.id, item.required)}
                          disabled={isPending}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${item.required ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {item.required ? "Required" : "Optional"}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isPending}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>

            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    Parent View Notes
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {isRegular
                      ? "Please label all books and uniform with the pupil's full name and class. Textbooks should match the official booklist issued for each class."
                      : "Please ensure all clothing items are labeled with the student's first and last name. We prefer soft, natural fibers where possible to encourage independent dressing."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Kit Item</DialogTitle>
            <DialogDescription>
              Add a new requirement to the {activeSection?.label ?? "selected"}{" "}
              {isRegular ? "supplies list" : "school kit list"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Item Name
              </label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={isRegular ? "e.g. Mathematical Set" : "e.g. Indoor Shoes"}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block gap-2">
                Requirement Level
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newItemRequired ? "default" : "outline"}
                  onClick={() => setNewItemRequired(true)}
                  className={`flex-1 ${newItemRequired ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200 border" : "text-slate-600"}`}
                >
                  Required
                </Button>
                <Button
                  type="button"
                  variant={!newItemRequired ? "default" : "outline"}
                  onClick={() => setNewItemRequired(false)}
                  className={`flex-1 ${!newItemRequired ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 border" : "text-slate-600"}`}
                >
                  Optional
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={isPending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
