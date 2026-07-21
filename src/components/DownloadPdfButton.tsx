"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadHtmlAsPdf } from "@/lib/pdf/download-pdf";

// Captures the element with the given id and downloads it as a PDF (client-only).
export function DownloadPdfButton({
  targetId,
  filename,
  label = "Download PDF",
}: {
  targetId: string;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    setBusy(true);
    try {
      await downloadHtmlAsPdf({ element: el, filename });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={handle}
      disabled={busy}
      variant="outline"
      className="gap-2 print:hidden"
    >
      <Download className="w-4 h-4" /> {busy ? "Preparing…" : label}
    </Button>
  );
}
