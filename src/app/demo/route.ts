import { NextRequest, NextResponse } from "next/server";

const ROLE_TO_DESTINATION = {
  admin: "/dashboard",
  teacher: "/teacher",
  parent: "/parent",
} as const;

export function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");

  if (!role || !(role in ROLE_TO_DESTINATION)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const destination =
    ROLE_TO_DESTINATION[role as keyof typeof ROLE_TO_DESTINATION];
  const response = NextResponse.redirect(new URL(destination, request.url));

  response.cookies.set("demo_role", role, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
