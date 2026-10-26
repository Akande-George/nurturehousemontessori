import { redirect } from "next/navigation";

/**
 * Observations are no longer a section of their own — they live in the
 * curriculum record book's Notes tab. Old links and bookmarks land there.
 */
export default function TeacherObservationsRedirect() {
  redirect("/teacher/curriculum");
}
