import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolNotices } from "@/lib/db/operations";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { NoticesReadMarker } from "./NoticesReadMarker";

export default async function NoticeBoardPage() {
  const { school } = await requireRole("parent");
  const supabase = await createClient();
  const notices = school ? await getSchoolNotices(supabase!, school.id) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <NoticesReadMarker noticeIds={notices.map((n) => n.id)} />

      <div>
        <h1 className="text-2xl font-serif text-slate-900">Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">
          Announcements from {school?.name ?? "your school"}, newest first.
        </p>
      </div>

      {notices.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No announcements have been posted yet.
          </CardContent>
        </Card>
      ) : (
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
                        {new Date(notice.created_at).toLocaleDateString(
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
