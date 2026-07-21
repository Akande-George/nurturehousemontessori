"use client";

import { useEffect } from "react";
import { markNoticeRead } from "@/lib/actions/operations";

export function NoticesReadMarker({ noticeIds }: { noticeIds: string[] }) {
  useEffect(() => {
    noticeIds.forEach((id) => {
      void markNoticeRead(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
