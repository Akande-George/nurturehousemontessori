"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ComponentType } from "react";
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  Heart,
  Home,
  ImageIcon,
  LogOut,
  Megaphone,
  Menu,
  PlusCircle,
  Search,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import type { Role, SchoolType } from "@/lib/db/types";

// Platform-level branding used for the super admin (not tied to any school).
const PLATFORM = { name: "Nurturehouse School Hub", logoUrl: "/logo2.png" };

export type ShellUser = { name: string; email: string; initial: string };
export type ShellSchool = { name: string; type: SchoolType } | null;

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

// ---------------------------------------------------------------------------
// Montessori navs (the original single-school experience)
// ---------------------------------------------------------------------------

const montessoriAdminNav: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home },
      { href: "/dashboard/students", label: "Students", icon: Users },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Admissions",
    items: [
      { href: "/dashboard/enrollment", label: "Applications", icon: FileText },
      {
        href: "/dashboard/letters",
        label: "Acceptance Letters",
        icon: FileText,
      },
      { href: "/dashboard/kits", label: "Kit Lists", icon: FileText },
      { href: "/dashboard/invites", label: "Portal Invites", icon: FileText },
      { href: "/dashboard/reports", label: "Academic Reports", icon: FileText },
    ],
  },
  {
    label: "Classrooms",
    items: [
      {
        href: "/dashboard/assignments",
        label: "Class Assignments",
        icon: Users,
      },
      {
        href: "/dashboard/attendance",
        label: "Attendance",
        icon: Calendar,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/accounting", label: "Billing", icon: CreditCard },
      {
        href: "/dashboard/after-school",
        label: "After School Care",
        icon: Heart,
      },
      {
        href: "/dashboard/resources",
        label: "Resource Library",
        icon: FolderOpen,
      },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

const montessoriTeacherNav: NavSection[] = [
  {
    label: "Today",
    items: [
      { href: "/teacher", label: "My Classroom", icon: Home },
      { href: "/teacher/attendance", label: "Attendance", icon: Users },
    ],
  },
  {
    label: "Classroom",
    items: [
      { href: "/teacher/students", label: "Students", icon: Users },
      { href: "/teacher/activity", label: "Activity Feed", icon: Heart },
      { href: "/teacher/observations", label: "Observations", icon: FileText },
      { href: "/teacher/curriculum", label: "Curriculum", icon: GraduationCap },
      {
        href: "/teacher/reports/child-report",
        label: "Child Report",
        icon: FileText,
      },
      {
        href: "/teacher/reports/daily",
        label: "Daily Reports",
        icon: FileText,
      },
      {
        href: "/teacher/reports/progress",
        label: "Termly Progress Report",
        icon: Award,
      },
      { href: "/teacher/log", label: "Bulk Logging", icon: FileText },
      { href: "/teacher/gallery", label: "Media Gallery", icon: ImageIcon },
    ],
  },
];

const montessoriParentNav: NavSection[] = [
  {
    label: "Home",
    items: [
      { href: "/parent", label: "Activity Feed", icon: Heart },
      { href: "/parent/notices", label: "Notice Board", icon: Megaphone },
      { href: "/parent/calendar", label: "Calendar", icon: Calendar },
      {
        href: "/parent/resources",
        label: "Resource Library",
        icon: FolderOpen,
      },
      { href: "/parent/attendance", label: "Attendance", icon: Calendar },
    ],
  },
  {
    label: "My Children",
    items: [
      { href: "/parent/reports", label: "Daily Reports", icon: FileText },
      {
        href: "/parent/progress-reports",
        label: "Termly Progress Report",
        icon: Award,
      },
      { href: "/parent/progress", label: "Academic Progress", icon: Calendar },
      {
        href: "/parent/invoices",
        label: "Invoices & Receipts",
        icon: CreditCard,
      },
      {
        href: "/parent/parameters",
        label: "Child Parameters",
        icon: Settings,
      },
      {
        href: "/parent/after-school",
        label: "After School Care",
        icon: Heart,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Regular (conventional) school navs
// ---------------------------------------------------------------------------

const regularAdminNav: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home },
      { href: "/dashboard/students", label: "Students", icon: Users },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/dashboard/classes", label: "Classes", icon: GraduationCap },
      { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
      { href: "/dashboard/timetable", label: "Timetable", icon: CalendarClock },
      { href: "/dashboard/results", label: "Report Cards", icon: Award },
      { href: "/dashboard/promotion", label: "Promotion", icon: TrendingUp },
    ],
  },
  {
    label: "Admissions",
    items: [
      { href: "/dashboard/enrollment", label: "Applications", icon: FileText },
      {
        href: "/dashboard/letters",
        label: "Acceptance Letters",
        icon: FileText,
      },
      { href: "/dashboard/kits", label: "Kit Lists", icon: FileText },
      { href: "/dashboard/invites", label: "Portal Invites", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/dashboard/attendance",
        label: "Attendance",
        icon: ClipboardList,
      },
      { href: "/dashboard/accounting", label: "Billing", icon: CreditCard },
      {
        href: "/dashboard/resources",
        label: "Resource Library",
        icon: FolderOpen,
      },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

const regularTeacherNav: NavSection[] = [
  {
    label: "Today",
    items: [
      { href: "/teacher", label: "My Classes", icon: Home },
      {
        href: "/teacher/attendance",
        label: "Class Register",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/teacher/gradebook", label: "Gradebook", icon: BookOpen },
      { href: "/teacher/report-cards", label: "Report Cards", icon: Award },
      { href: "/teacher/timetable", label: "Timetable", icon: CalendarClock },
      { href: "/teacher/homework", label: "Homework", icon: FileText },
      { href: "/teacher/students", label: "Students", icon: Users },
    ],
  },
];

const regularParentNav: NavSection[] = [
  {
    label: "Home",
    items: [
      { href: "/parent/notices", label: "Notice Board", icon: Megaphone },
      { href: "/parent/calendar", label: "Calendar", icon: Calendar },
      {
        href: "/parent/attendance",
        label: "Attendance",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/parent/results", label: "Report Cards", icon: Award },
      { href: "/parent/grades", label: "Subject Grades", icon: GraduationCap },
      { href: "/parent/timetable", label: "Timetable", icon: CalendarClock },
      { href: "/parent/homework", label: "Homework", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        href: "/parent/invoices",
        label: "Invoices & Receipts",
        icon: CreditCard,
      },
    ],
  },
];

const superAdminNav: NavSection[] = [
  {
    label: "Platform",
    items: [
      { href: "/super-admin", label: "Overview", icon: Home },
      { href: "/super-admin/schools", label: "Schools", icon: Building2 },
      {
        href: "/super-admin/schools/new",
        label: "Add School",
        icon: PlusCircle,
      },
    ],
  },
];

const NAV_TABLE: Record<
  "admin" | "teacher" | "parent",
  Record<SchoolType, NavSection[]>
> = {
  admin: { montessori: montessoriAdminNav, regular: regularAdminNav },
  teacher: { montessori: montessoriTeacherNav, regular: regularTeacherNav },
  parent: { montessori: montessoriParentNav, regular: regularParentNav },
};

function navFor(role: Role, type: SchoolType): NavSection[] {
  if (role === "super_admin") return superAdminNav;
  return NAV_TABLE[role][type];
}

function homeFor(role: Role, type: SchoolType): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "teacher") return "/teacher";
  if (role === "parent") return type === "regular" ? "/parent/results" : "/parent";
  return "/dashboard";
}

function BrandMark({
  name,
  compact = false,
}: {
  name: string;
  compact?: boolean;
}) {
  const initial = name.trim()[0]?.toUpperCase() ?? "S";
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-montessori-primary font-serif text-lg text-white shadow-sm">
        {initial}
      </div>
      {!compact && (
        <span className="truncate font-serif text-[15px] leading-tight text-slate-900">
          {name}
        </span>
      )}
    </div>
  );
}

function isItemActive(href: string, pathname: string) {
  if (
    href === "/dashboard" ||
    href === "/teacher" ||
    href === "/parent" ||
    href === "/super-admin"
  ) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  pathname,
  sections,
  onNavigate,
}: {
  pathname: string;
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-7">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="px-3 mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {section.label}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isItemActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-montessori-primary/8 text-montessori-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-montessori-primary"
                      />
                    )}
                    <Icon
                      className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function RoleShell({
  role,
  user,
  school,
  children,
}: {
  role: Role;
  user: ShellUser;
  school: ShellSchool;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const schoolType: SchoolType = school?.type ?? "montessori";

  const isSuper = role === "super_admin";
  const brandName = isSuper ? PLATFORM.name : school?.name ?? PLATFORM.name;
  const homeHref = homeFor(role, schoolType);

  const sections = useMemo(
    () => navFor(role, schoolType),
    [role, schoolType],
  );

  const showSearch = role === "admin" || role === "teacher";
  // Mobile bottom bar (parent only) mirrors the resolved parent nav's first section.
  const bottomBarItems = sections[0]?.items.slice(0, 3) ?? [];

  return (
    <div className="font-tight flex min-h-screen bg-slate-50 pb-16 md:pb-0">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-100 bg-white md:flex">
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <Link
            href={homeHref}
            className="transition-opacity hover:opacity-80"
          >
            <BrandMark name={brandName} />
          </Link>
        </div>
        <SidebarNav pathname={pathname} sections={sections} />
        <div className="border-t border-slate-100 p-3">
          <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-montessori-primary text-sm font-medium text-white shadow-sm">
              {user.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Log out"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            aria-hidden
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          />
          <aside className="relative flex w-72 max-w-[80vw] flex-col border-r border-slate-100 bg-white animate-in slide-in-from-left duration-200">
            <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
              <BrandMark name={brandName} />
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav
              pathname={pathname}
              sections={sections}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="border-t border-slate-100 p-3">
              <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-montessori-primary text-sm font-medium text-white shadow-sm">
                  {user.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    aria-label="Log out"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <BrandMark name={brandName} compact />
          </div>

          {showSearch ? (
            <div className="hidden max-w-md flex-1 md:flex">
              <div className="relative w-full">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  placeholder="Search students, notices, invoices..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-montessori-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-montessori-primary/20"
                />
              </div>
            </div>
          ) : (
            <div className="hidden md:block text-sm font-medium text-slate-500">
              {brandName}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-montessori-primary text-xs font-medium text-white md:hidden">
              {user.initial}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        {role === "parent" && (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-md grid-cols-3">
              {bottomBarItems.map((item) => {
                const active = isItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${
                      active ? "text-montessori-primary" : "text-slate-500"
                    }`}
                  >
                    <Icon
                      className="h-4 w-4"
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
