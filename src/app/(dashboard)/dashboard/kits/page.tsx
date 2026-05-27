"use client";

import { useState } from "react";
import { Package, Download, Share2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type ProgramType = "infant" | "toddler" | "childrensHouse";

const PROGRAM_LABELS: Record<ProgramType, string> = {
  infant: "Infant Community (Nurture Bloomers)",
  toddler: "Toddler Community (Nurture Buds)",
  childrensHouse: "Children's House (Nurture Explorers)",
};

export default function SchoolKitPage() {
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramType>("childrensHouse");
  const { toast } = useToast();

  const [kitItems, setKitItems] = useState({
    infant: [
      { id: 1, name: "Soft Indoor Shoes or Grip Socks", required: true },
      { id: 2, name: "Complete Changes of Clothes (x3)", required: true },
      {
        id: 3,
        name: "Diapers, Wipes, and Changing Essentials",
        required: true,
      },
      { id: 4, name: "Comfort Item for Rest Time", required: false },
      { id: 5, name: "Labelled Feeding Items / Bibs", required: true },
    ],
    toddler: [
      { id: 1, name: "Indoor Shoes (Soft-soled)", required: true },
      { id: 2, name: "Complete Changes of Clothes (x3)", required: true },
      { id: 3, name: "Diapers/Pull-ups (if applicable)", required: true },
      { id: 4, name: "Water Bottle", required: true },
      { id: 5, name: "Weather-appropriate Outerwear", required: true },
    ],
    childrensHouse: [
      { id: 1, name: "Indoor Slippers (Hard-soled)", required: true },
      { id: 2, name: "Complete Changes of Clothes (x2)", required: true },
      { id: 3, name: "Bento-style Lunchbox", required: true },
      { id: 4, name: "Refillable Water Bottle", required: true },
      { id: 5, name: "Muddy Buddy / Rain Gear", required: true },
      { id: 6, name: "Nap Roll (for full-day students)", required: false },
    ],
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemRequired, setNewItemRequired] = useState(true);

  const handleAction = (actionName: string) => {
    toast({
      title: actionName,
      description: "Kit list action completed for the selected programme.",
    });
  };

  const handleDownloadPdf = async () => {
    const items = kitItems[selectedProgram];
    await downloadStructuredPdf({
      filename: `${PROGRAM_LABELS[selectedProgram].replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-kit-list.pdf`,
      header: "Nurture House Montessori · Welcome Kit",
      footer: `Generated ${new Date().toLocaleDateString("en-NG")}`,
      lines: [
        { kind: "title", text: "Welcome Kit" },
        { kind: "subtitle", text: PROGRAM_LABELS[selectedProgram] },
        { kind: "rule" },
        {
          kind: "body",
          text: "Please label every item with your child's full name. Items below help your child settle into the prepared environment with confidence.",
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
      description: `${PROGRAM_LABELS[selectedProgram]} kit list saved as PDF.`,
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem = {
      id: Date.now(),
      name: newItemName.trim(),
      required: newItemRequired,
    };
    setKitItems((prev) => ({
      ...prev,
      [selectedProgram]: [...prev[selectedProgram], newItem],
    }));
    setNewItemName("");
    setNewItemRequired(true);
    setIsAddOpen(false);
    toast({
      title: "Item Added",
      description: `${newItem.name} added to ${PROGRAM_LABELS[selectedProgram]} kit.`,
    });
  };

  const handleDeleteItem = (id: number) => {
    setKitItems((prev) => ({
      ...prev,
      [selectedProgram]: prev[selectedProgram].filter((item) => item.id !== id),
    }));
    toast({
      title: "Item Removed",
      description: `The item has been removed from the list.`,
    });
  };

  const toggleItemRequired = (id: number) => {
    setKitItems((prev) => ({
      ...prev,
      [selectedProgram]: prev[selectedProgram].map((item) =>
        item.id === id ? { ...item, required: !item.required } : item,
      ),
    }));
    toast({
      title: "Requirement Updated",
      description: `Item requirement status changed.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            School Kit Lists
          </h1>
          <p className="text-sm text-slate-500">
            Manage required supplies and distribute checklists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="font-medium"
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button
            onClick={() => handleAction("Distribute Links")}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm"
          >
            <Share2 className="w-4 h-4 mr-2" /> Distribute Links
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setSelectedProgram("infant")}
            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
              selectedProgram === "infant"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
            }`}
          >
            <div>
              <p className="font-medium">Infant Community (Nurture Bloomers)</p>
              <p
                className={`text-xs mt-0.5 ${selectedProgram === "infant" ? "text-blue-600/80" : "text-slate-500"}`}
              >
                6 months - 18 months
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedProgram("toddler")}
            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
              selectedProgram === "toddler"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
            }`}
          >
            <div>
              <p className="font-medium">Toddler Community (Nurture Buds)</p>
              <p
                className={`text-xs mt-0.5 ${selectedProgram === "toddler" ? "text-emerald-600/80" : "text-slate-500"}`}
              >
                18 months - 3 years
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedProgram("childrensHouse")}
            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
              selectedProgram === "childrensHouse"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
            }`}
          >
            <div>
              <p className="font-medium">
                Children's House (Nurture Explorers)
              </p>
              <p
                className={`text-xs mt-0.5 ${selectedProgram === "childrensHouse" ? "text-amber-600/80" : "text-slate-500"}`}
              >
                3 - 6 years
              </p>
            </div>
          </button>
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
                    {PROGRAM_LABELS[selectedProgram]} Requirements
                  </h2>
                  <p className="text-sm text-slate-500">
                    {kitItems[selectedProgram].length} total items in list
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setIsAddOpen(true)}
                className="text-montessori-primary hover:bg-montessori-primary/5 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <CardContent className="flex-1 p-6">
              <ul className="space-y-3">
                {kitItems[selectedProgram].map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white" />
                      <span className="font-medium text-slate-800">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItemRequired(item.id)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${item.required ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {item.required ? "Required" : "Optional"}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
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
                    Please ensure all clothing items are labeled with the
                    student's first and last name. We prefer soft, natural
                    fibers where possible to encourage independent dressing.
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
              Add a new requirement to the {PROGRAM_LABELS[selectedProgram]}{" "}
              school kit list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-700"
              >
                Item Name
              </label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Indoor Shoes"
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
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
