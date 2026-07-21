import Link from "next/link";
import { PlusCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getAllSchools, getPlatformStats } from "@/lib/db/schools";
import { readTheme } from "@/lib/db/types";
import { PendingApprovals } from "./PendingApprovals";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-none capitalize",
  pending: "bg-amber-100 text-amber-700 border-none capitalize",
  suspended: "bg-rose-100 text-rose-700 border-none capitalize",
};

export default async function SuperAdminSchoolsPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const [schools, stats] = await Promise.all([
    getAllSchools(supabase!),
    getPlatformStats(supabase!),
  ]);
  const statFor = (id: string) => stats.find((s) => s.school_id === id);
  const pending = schools
    .filter((s) => s.status === "pending")
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      type: s.type,
      contactEmail: s.contact_email,
      primary: readTheme(s.theme).primary,
    }));

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Schools</h1>
          <p className="text-sm text-slate-500">
            Every school on the platform. Open a school to view its numbers and
            send it a notification.
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

      <PendingApprovals schools={pending} />

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((school) => {
                const st = statFor(school.id);
                const theme = readTheme(school.theme);
                return (
                  <TableRow key={school.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-8 rounded-lg shrink-0"
                          style={{ background: `rgb(${theme.primary})` }}
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            {school.name}
                          </p>
                          <p className="text-xs text-slate-500">{school.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{Number(st?.student_count ?? 0)}</TableCell>
                    <TableCell>{Number(st?.staff_count ?? 0)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_BADGE[school.status] ?? STATUS_BADGE.pending}
                      >
                        {school.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="icon-nudge h-8 gap-1.5"
                      >
                        <Link href={`/super-admin/schools/${school.id}`}>
                          View details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
