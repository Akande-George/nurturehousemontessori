import { redirect } from "next/navigation";

// The termly report was replaced by the progress report. Kept for one release
// so old bookmarks and notification links keep working.
export default function TeacherTermlyReportPage() {
  redirect("/teacher/reports/progress");
}
