import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolApplications } from "@/lib/db/operations";
import { EnrollmentReviewClient } from "./EnrollmentReviewClient";

export default async function EnrollmentPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const applications = await getSchoolApplications(supabase, school.id);

  return <EnrollmentReviewClient applications={applications} />;
}
