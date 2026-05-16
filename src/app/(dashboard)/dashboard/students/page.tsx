"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function StudentsPage() {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logType, setLogType] = useState("Observation");
  const [activeClass, setActiveClass] = useState("All");
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
      title: `${actionName} started`,
      description:
        "You can continue this workflow from the student profile pages.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Student Directory
          </h1>
          <p className="text-sm text-slate-500">
            Monitor attendance, progress, and daily logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search students..."
              className="pl-9 w-64 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Button
            onClick={() => setIsLogOpen(true)}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Roster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Class Selection / Filter sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3 text-sm">
                Classrooms
              </h3>
              <div className="space-y-1">
                {[
                  { id: "All", label: "All Students (142)" },
                  { id: "Nurture Buds A", label: "Nurture Buds A - Sun (12)" },
                  { id: "Nurture Buds B", label: "Nurture Buds B - Moon (12)" },
                  {
                    id: "Nurture Explorers A",
                    label: "Nurture Explorers A - Elm (24)",
                  },
                  {
                    id: "Nurture Explorers B",
                    label: "Nurture Explorers B - Oak (24)",
                  },
                ].map((cls) => (
                  <Button
                    key={cls.id}
                    variant="ghost"
                    onClick={() => setActiveClass(cls.id)}
                    className={`w-full justify-start font-medium ${
                      activeClass === cls.id
                        ? "text-montessori-primary bg-montessori-primary/5 hover:bg-montessori-primary/10 hover:text-montessori-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {cls.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-montessori-earth/10 border-montessori-earth/20 shadow-none">
            <CardContent className="p-5">
              <h3 className="font-serif font-medium text-slate-900 mb-2">
                Needs Attention
              </h3>
              <ul className="space-y-3 mt-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-montessori-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Liam P.
                    </p>
                    <p className="text-xs text-slate-600">
                      No nap logged today
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-montessori-earth mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Maya S.
                    </p>
                    <p className="text-xs text-slate-600">
                      Medication due at 2pm
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Student Grid */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Sarah Jenkins",
                class: "Nurture Explorers A",
                age: "4 yrs 2 mo",
                presence: "Present",
                ms: "Practical Life",
                bg: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
              },
              {
                name: "Leo Martinez",
                class: "Nurture Buds A",
                age: "2 yrs 1 mo",
                presence: "Absent",
                ms: "-",
                bg: "bg-slate-100 text-slate-700 hover:bg-slate-100/80",
              },
              {
                name: "Zoe Wong",
                class: "Nurture Explorers B",
                age: "5 yrs 6 mo",
                presence: "Present",
                ms: "Sensorial",
                bg: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
              },
              {
                name: "Elias Thorne",
                class: "Nurture Bloomers",
                age: "7 yrs 3 mo",
                presence: "Present",
                ms: "Math",
                bg: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
              },
              {
                name: "Mia Chen",
                class: "Nurture Buds B",
                age: "1 yr 10 mo",
                presence: "Present",
                ms: "Language",
                bg: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
              },
              {
                name: "Jackson Lee",
                class: "Nurture Explorers A",
                age: "4 yrs 8 mo",
                presence: "Early Pickup",
                ms: "-",
                bg: "bg-amber-100 text-amber-700 hover:bg-amber-100/80",
              },
            ]
              .filter((s) => activeClass === "All" || s.class === activeClass)
              .map((student, i) => (
                <Link
                  href={`/dashboard/students/${i + 1}`}
                  key={i}
                  className="block"
                >
                  <Card className="border-slate-100 shadow-sm hover-lift transition-all group cursor-pointer flex flex-col h-full">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900 text-sm group-hover:text-montessori-primary transition-colors">
                              {student.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {student.class} • {student.age}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Status</span>
                          <Badge
                            variant="secondary"
                            className={`${student.bg} font-medium border-none`}
                          >
                            {student.presence}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">
                            New Presentation
                          </span>
                          <span className="font-medium text-slate-700">
                            {student.ms}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Log Activity Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Student Activity</DialogTitle>
            <DialogDescription>
              Record an observation, meal, nap, or incident for a student.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Student Name
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search students..."
                  className="pl-9 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Activity Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "Observation",
                  "Meal",
                  "Nap",
                  "Toilet",
                  "Medication",
                  "Incident",
                ].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={logType === type ? "default" : "outline"}
                    onClick={() => setLogType(type)}
                    className={`h-9 text-xs justify-start px-3 font-medium ${
                      logType === type
                        ? "bg-montessori-primary text-white hover:bg-montessori-primary/90 border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Notes
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-montessori-primary"
                placeholder={`Add details about this ${logType.toLowerCase()}...`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsLogOpen(false);
                toast({
                  title: "Activity Logged",
                  description: `Successfully recorded ${logType.toLowerCase()} for student.`,
                });
              }}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
