import type { Role, SchoolType } from "@/lib/db/types";

// Landing route for a role (parents differ by school type — regular parents land
// on results, montessori parents on the activity feed).
export function homeForRole(role: Role, schoolType?: SchoolType | null): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/dashboard";
  if (role === "teacher") return "/teacher";
  return schoolType === "regular" ? "/parent/results" : "/parent";
}

// Which URL prefix each role's area lives under (for middleware role-gating).
export const ROLE_PREFIX: Record<Role, string> = {
  super_admin: "/super-admin",
  admin: "/dashboard",
  teacher: "/teacher",
  parent: "/parent",
};
