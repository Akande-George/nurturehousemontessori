"use client";

import { useMemo, useState } from "react";
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
import {
  createNotice,
  getParentNotices,
  getTotalParentCount,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { Eye, Users } from "lucide-react";

export default function DashboardPage() {
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const { toast } = useToast();
  const store = useDemoStore();

  const metrics = useMemo(() => {
    const pendingInvoices = store.invoices.filter(
      (invoice) => invoice.status === "unpaid",
    );
    return [
      { label: "Enrolled Students", value: store.students.length.toString() },
      { label: "Active Staff", value: "18" },
      { label: "Pending Apps", value: "12" },
      {
        label: "Outstanding Invoices",
        value: pendingInvoices.length.toString(),
      },
    ];
  }, [store]);

  const notices = getParentNotices().slice(0, 4);
  const totalParents = getTotalParentCount();

  const handlePostNotice = () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and message before publishing.",
      });
      return;
    }

    createNotice({
      title: noticeTitle.trim(),
      content: noticeBody.trim(),
    });

    setNoticeTitle("");
    setNoticeBody("");
    setIsNoticeOpen(false);
    toast({
      title: "Notice posted",
      description:
        "Parents can now see this in the notice board and activity feed.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Admin Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Role-separated operations cockpit with cross-role demo data.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Cross-role storyline status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <span>Invoice issued for Zoe Wong</span>
              <Badge variant="outline" className="bg-white">
                Billing
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <span>Teacher observation shared</span>
              <Badge variant="outline" className="bg-white">
                Classroom
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <span>Parent notices synced</span>
              <Badge variant="outline" className="bg-white">
                Family
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Recent notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.map((notice) => {
              const readCount = notice.readBy.length;
              const seenAll = readCount >= totalParents;
              return (
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
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {notice.content}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {readCount} of {totalParents} parent
                      {totalParents !== 1 ? "s" : ""} seen
                    </span>
                    {seenAll && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 py-0 border-emerald-200 text-emerald-700 bg-emerald-50 ml-1"
                      >
                        All seen
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

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
