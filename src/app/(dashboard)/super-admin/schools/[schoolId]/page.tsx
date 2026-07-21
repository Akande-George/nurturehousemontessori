import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolById, getSchoolStats } from "@/lib/db/schools";
import { SchoolDetailClient } from "./SchoolDetailClient";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  await requireRole("super_admin");
  const { schoolId } = await params;
  const supabase = await createClient();
  const school = await getSchoolById(supabase!, schoolId);

  if (!school) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-slate-500">School not found.</p>
        <Link href="/super-admin/schools" className="text-montessori-primary hover:underline text-sm">
          Back to schools
        </Link>
      </div>
    );
  }
  const stats = await getSchoolStats(supabase!, schoolId);
  return <SchoolDetailClient school={school} stats={stats} />;
}
