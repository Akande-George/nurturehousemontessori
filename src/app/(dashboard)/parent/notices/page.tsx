"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getParentNotices,
  getRoleUser,
  markNoticeRead,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { Bell } from "lucide-react";

export default function NoticeBoardPage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const notices = getParentNotices();

  // Mark all notices as read when parent opens this page
  useEffect(() => {
    notices.forEach((notice) => {
      if (!notice.readBy.includes(parent.id)) {
        markNoticeRead(notice.id, parent.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Notice Board</h1>
        <p className="text-sm text-slate-500 mt-1">
          Announcements from Nurture House Montessori, newest first.
        </p>
      </div>

      <div className="space-y-4">
        {notices.map((notice, i) => {
          const alreadyRead = notice.readBy.includes(parent.id);
          return (
            <Card
              key={notice.id}
              className={`border-slate-100 shadow-sm ${i === 0 ? "border-l-4 border-l-montessori-primary" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-montessori-primary/10" : "bg-slate-100"}`}
                  >
                    <Bell
                      className={`w-4 h-4 ${i === 0 ? "text-montessori-primary" : "text-slate-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {notice.title}
                        </p>
                        {!alreadyRead && (
                          <span className="inline-block w-2 h-2 rounded-full bg-montessori-primary" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(notice.createdAt).toLocaleDateString(
                          "en-NG",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {notice.content}
                    </p>
                    {alreadyRead && (
                      <Badge
                        variant="outline"
                        className="mt-3 text-[10px] h-5 border-emerald-200 text-emerald-700 bg-emerald-50"
                      >
                        Read
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { getParentNotices, useDemoStore } from "@/lib/mock/demo-store";
import { Bell } from "lucide-react";

export default function NoticeBoardPage() {
  useDemoStore();
  const notices = getParentNotices();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Notice Board</h1>
        <p className="text-sm text-slate-500 mt-1">
          Announcements from Nurture House Montessori, newest first.
        </p>
      </div>

      <div className="space-y-4">
        {notices.map((notice, i) => (
          <Card
            key={notice.id}
            className={`border-slate-100 shadow-sm ${i === 0 ? "border-l-4 border-l-montessori-primary" : ""}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-montessori-primary/10" : "bg-slate-100"}`}
                >
                  <Bell
                    className={`w-4 h-4 ${i === 0 ? "text-montessori-primary" : "text-slate-400"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {notice.title}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(notice.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {notice.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
