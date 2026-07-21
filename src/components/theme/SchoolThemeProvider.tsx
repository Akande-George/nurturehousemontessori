"use client";

import { useLayoutEffect } from "react";
import type { SchoolTheme } from "@/lib/db/types";

// Lighten an "r g b" channel triplet toward white by `amount` (0..1).
function tint(triplet: string, amount: number) {
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return triplet;
  const [r, g, b] = parts;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `${mix(r)} ${mix(g)} ${mix(b)}`;
}

/**
 * Applies a school's brand palette to the document root as CSS variables so
 * every `montessori-*` Tailwind color reflects the current school. Theme is
 * passed as a prop from the server layout (no client data store).
 */
export function SchoolThemeProvider({
  theme,
  children,
}: {
  theme: SchoolTheme | null;
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--montessori-primary", theme.primary);
    root.style.setProperty("--montessori-secondary", theme.secondary);
    root.style.setProperty("--montessori-accent", theme.accent);
    root.style.setProperty("--montessori-sky", tint(theme.primary, 0.9));
    return () => {
      root.style.removeProperty("--montessori-primary");
      root.style.removeProperty("--montessori-secondary");
      root.style.removeProperty("--montessori-accent");
      root.style.removeProperty("--montessori-sky");
    };
  }, [theme?.primary, theme?.secondary, theme?.accent]);

  return <>{children}</>;
}
