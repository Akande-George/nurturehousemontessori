import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getCalendarEvents } from "@/lib/db/operations";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const events = await getCalendarEvents(supabase, school.id);
  return <CalendarClient events={events} />;
}
