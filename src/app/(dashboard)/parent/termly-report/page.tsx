import { redirect } from "next/navigation";

// The termly report was replaced by the progress report. Kept for one release
// so old bookmarks and emailed links keep working.
export default function ParentTermlyReportPage() {
  redirect("/parent/progress-reports");
}
