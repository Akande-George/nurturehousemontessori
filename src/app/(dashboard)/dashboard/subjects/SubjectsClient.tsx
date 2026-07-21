"use client";

import { useState, useTransition } from "react";
import { PlusCircle, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createSubject } from "@/lib/actions/academics";
import type { Subject } from "@/lib/db/types";

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const resetForm = () => {
    setName("");
    setCode("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "Subject name is required", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await createSubject({
        name: name.trim(),
        code: code.trim() || undefined,
      });
      if (res.ok) {
        toast({ title: `${name.trim()} added` });
        resetForm();
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Subjects</h1>
          <p className="text-sm text-slate-500">
            The subjects taught across the school and their codes.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-100 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Code (optional)</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MTH"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleCreate}
                disabled={pending}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                Add Subject
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {subjects.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No subjects yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Add the subjects taught in your school to start building
                gradebooks and timetables.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium text-slate-900">
                      {subject.name}
                    </TableCell>
                    <TableCell>
                      {subject.code ? (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-none font-mono"
                        >
                          {subject.code}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
