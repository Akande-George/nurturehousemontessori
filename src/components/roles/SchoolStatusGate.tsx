import { Clock, ShieldAlert, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { Role, SchoolStatus } from "@/lib/db/types";

// Full-screen gate shown to a school's users while their account is not active
// (pending platform-admin approval, or suspended).
export function SchoolStatusGate({
  schoolName,
  status,
  role,
}: {
  schoolName: string;
  status: SchoolStatus;
  role: Role;
}) {
  const pending = status === "pending";
  const Icon = pending ? Clock : ShieldAlert;
  const accent = pending
    ? "bg-amber-100 text-amber-600"
    : "bg-rose-100 text-rose-600";

  const title = pending
    ? "Awaiting approval"
    : "Account suspended";

  const body = pending
    ? role === "admin"
      ? "Thanks for registering. Your school is waiting for approval from the platform team. You'll get an email as soon as it's activated — then you can sign back in and set everything up."
      : "Your school's account is still being reviewed by the platform team. Please check back once it's been activated."
    : "Your school's access has been paused by the platform team. Please contact support to restore access.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dot-grid p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm animate-pop-in">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${accent} ${
            pending ? "pulse-ring" : ""
          }`}
        >
          <Icon className={`h-7 w-7 ${pending ? "animate-float" : ""}`} />
        </div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          {schoolName}
        </p>
        <h1 className="mb-3 font-serif text-2xl text-slate-900">{title}</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-600">{body}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
