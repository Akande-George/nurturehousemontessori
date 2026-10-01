"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markNoticesRead } from "@/lib/actions/operations";

// Viewing the board marks its notices read, then refreshes so the unread badge
// on the Notice Board nav item clears.
export function NoticesReadMarker({
  noticeIds,
  unread,
}: {
  noticeIds: string[];
  unread: number;
}) {
  const router = useRouter();
  useEffect(() => {
    if (unread === 0) return;
    void markNoticesRead(noticeIds).then((res) => {
      if (res.ok) router.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
