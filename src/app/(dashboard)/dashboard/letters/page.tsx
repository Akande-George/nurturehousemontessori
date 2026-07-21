import { Mail, CheckCircle2, Inbox } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolApplications } from "@/lib/db/operations";

export default async function AcceptanceLettersPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const applications = await getSchoolApplications(supabase, school.id);
  const accepted = applications.filter((a) => a.status === "accepted");

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Acceptance Letters
          </h1>
          <p className="text-sm text-slate-500">
            Welcome packets for accepted families. {accepted.length} to send.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Accepted applications */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-medium text-slate-900 text-sm">
                Letters to send
              </h2>
            </div>

            {accepted.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-800">
                  No accepted applications
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Accept an application in the Enrollment queue and its welcome
                  letter will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {accepted.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 mb-0.5">
                          {app.child_name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2 truncate">
                          To: {app.parent_name} ({app.parent_email})
                        </p>
                        <span className="text-xs text-slate-400">
                          Accepted ·{" "}
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 border-amber-200 text-amber-700 shrink-0"
                    >
                      Ready to send
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Template preview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="font-serif text-lg text-slate-900">
                Letter Template
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 leading-relaxed">
                Acceptance emails automatically pull variables such as student
                name, program, and start dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-xs font-medium text-slate-400">
                  Subject: Welcome to {school.name}
                </p>
                <div className="w-full h-px bg-slate-200" />
                <p className="text-xs text-slate-600">
                  Dear [Parent First Name],
                </p>
                <p className="text-xs text-slate-600">
                  We are delighted to offer [Student Name] a place at our school
                  for the upcoming school year...
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-montessori-earth/10 border-montessori-earth/20 shadow-none">
            <CardContent className="p-6">
              <h3 className="font-medium text-montessori-earth mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Automated on accept
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                When an application is accepted, the family is automatically
                emailed a confirmation and the student is added to the roster.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
