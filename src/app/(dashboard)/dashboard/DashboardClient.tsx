"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createNotice } from "@/lib/actions/operations";
import { AlertTriangle, HeartPulse } from "lucide-react";
import type { Notice } from "@/lib/db/types";

export type MedicalStudent = {
  id: string;
  name: string;
  classroom: string;
  avatar_color: string;
  allergies: string[];
  medical_notes: string | null;
};

type Stats = {
  studentCount: number;
  staffCount: number;
  classCount: number;
  outstanding: number;
};

export function DashboardClient({
  stats,
  totalStudents,
  notices,
  medicalStudents,
}: {
  stats: Stats;
  totalStudents: number;
  notices: Notice[];
  medicalStudents: MedicalStudent[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");

  const metrics = [
    { label: "Enrolled Students", value: stats.studentCount.toString() },
    { label: "Active Staff", value: stats.staffCount.toString() },
    { label: "Classes", value: stats.classCount.toString() },
    { label: "Outstanding Invoices", value: stats.outstanding.toString() },
  ];

  const handlePostNotice = () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and message before publishing.",
        variant: "destructive",
      });
      return;
    }
    start(async () => {
      const res = await createNotice({
        title: noticeTitle.trim(),
        content: noticeBody.trim(),
      });
      if (res.ok) {
        setNoticeTitle("");
        setNoticeBody("");
        setIsNoticeOpen(false);
        toast({ title: "Notice posted" });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Admin Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your school at a glance.
          </p>
        </div>
        <Button
          onClick={() => setIsNoticeOpen(true)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
        >
          Post to Notice Board
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              <p className="text-3xl font-serif text-slate-900 mt-2">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Medical Watchlist — school-wide */}
      {medicalStudents.length > 0 && (
        <Card className="border-2 border-rose-200 shadow-sm bg-rose-50/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-rose-900">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Medical Watchlist
                <Badge
                  variant="outline"
                  className="bg-white text-rose-700 border-rose-200 ml-1"
                >
                  {medicalStudents.length} of {totalStudents}
                </Badge>
              </CardTitle>
              <p className="text-xs text-rose-700/80 font-medium">
                Required reading for staff and front-office
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medicalStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-xl bg-white border border-rose-100 p-3.5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {student.classroom}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    {student.allergies.length > 0 && (
                      <p className="flex items-start gap-1.5 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                        <span>
                          <span className="font-semibold">Allergies: </span>
                          {student.allergies.join(", ")}
                        </span>
                      </p>
                    )}
                    {(student.medical_notes ?? "").trim().length > 0 && (
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">
                          Notes:{" "}
                        </span>
                        {student.medical_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Recent notices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notices.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No notices posted yet.
            </p>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-lg border border-slate-100 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-slate-900">{notice.title}</p>
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">
                    All parents
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {notice.content}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isNoticeOpen} onOpenChange={setIsNoticeOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create school notice</DialogTitle>
            <DialogDescription>
              This publishes to all parents and appears instantly in the parent
              portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={noticeTitle}
              onChange={(event) => setNoticeTitle(event.target.value)}
              placeholder="Title"
            />
            <Textarea
              value={noticeBody}
              onChange={(event) => setNoticeBody(event.target.value)}
              placeholder="Message"
              className="min-h-28"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoticeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePostNotice}
              disabled={pending}
              className="bg-montessori-primary text-white"
            >
              Publish Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
