import Link from "next/link";
import { Building2, GraduationCap, Users, PlusCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getAllSchools, getPlatformStats } from "@/lib/db/schools";
import { readTheme } from "@/lib/db/types";

export default async function SuperAdminOverviewPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const [schools, stats] = await Promise.all([
    getAllSchools(supabase!),
    getPlatformStats(supabase!),
  ]);
  const statFor = (id: string) => stats.find((s) => s.school_id === id);
  const totalStudents = stats.reduce((n, s) => n + Number(s.student_count), 0);
  const totalStaff = stats.reduce((n, s) => n + Number(s.staff_count), 0);
  const pendingCount = schools.filter((s) => s.status === "pending").length;

  const tiles = [
    { label: "Schools", value: schools.length, icon: Building2 },
    { label: "Total Students", value: totalStudents, icon: Users },
    { label: "Total Staff", value: totalStaff, icon: GraduationCap },
    { label: "Pending Approval", value: pendingCount, icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500">
            Manage every school on the platform from one place.
          </p>
        </div>
        <Button
          asChild
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <Link href="/super-admin/schools/new">
            <PlusCircle className="w-4 h-4" /> Add School
          </Link>
        </Button>
      </div>

      {pendingCount > 0 && (
        <Link
          href="/super-admin/schools"
          className="icon-nudge mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100/60 animate-pop-in"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
            <p className="text-sm text-amber-900">
              <span className="font-semibold">
                {pendingCount} school{pendingCount === 1 ? "" : "s"}
              </span>{" "}
              waiting for approval
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-amber-700">
            Review <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiles.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-100 shadow-sm hover-lift">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
                    {stat.label}
                  </span>
                </div>
                <p className="text-3xl font-serif text-slate-900">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-base font-medium text-slate-900">Schools</h2>
            <Link
              href="/super-admin/schools"
              className="text-sm font-medium text-montessori-primary hover:underline"
            >
              Manage all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {schools.length === 0 && (
              <p className="p-6 text-sm text-slate-500">No schools yet.</p>
            )}
            {schools.map((school) => {
              const st = statFor(school.id);
              const theme = readTheme(school.theme);
              return (
                <Link
                  key={school.id}
                  href={`/super-admin/schools/${school.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 rounded-lg shrink-0"
                      style={{ background: `rgb(${theme.primary})` }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {school.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Number(st?.student_count ?? 0)} students ·{" "}
                        {Number(st?.staff_count ?? 0)} staff
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        school.type === "montessori"
                          ? "bg-emerald-100 text-emerald-700 border-none capitalize"
                          : "bg-indigo-100 text-indigo-700 border-none capitalize"
                      }
                    >
                      {school.type}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        school.status === "active"
                          ? "bg-emerald-100 text-emerald-700 border-none capitalize"
                          : school.status === "suspended"
                            ? "bg-rose-100 text-rose-700 border-none capitalize"
                            : "bg-amber-100 text-amber-700 border-none capitalize"
                      }
                    >
                      {school.status}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
