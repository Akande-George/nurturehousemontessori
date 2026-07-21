import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import {
  getStudentsForParent,
  getStudentMedications,
  type Medication,
} from "@/lib/db/students";
import { ParametersClient } from "./ParametersClient";

export default async function ParametersPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) return null;

  const children = await getStudentsForParent(supabase, user.id);

  const medicationsByChild: Record<string, Medication[]> = {};
  await Promise.all(
    children.map(async (c) => {
      medicationsByChild[c.id] = await getStudentMedications(supabase, c.id);
    }),
  );

  return (
    <ParametersClient
      children={children}
      medicationsByChild={medicationsByChild}
    />
  );
}
