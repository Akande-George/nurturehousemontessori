import { redirect } from "next/navigation";

/**
 * A child's observations now open in the record book, so old links land on
 * that child's page. This also covers the moved bulk screen: the former
 * /teacher/observations/bulk matches here and lands on /teacher/curriculum/bulk.
 */
export default async function StudentObservationRedirect({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  redirect(`/teacher/curriculum/${studentId}`);
}
