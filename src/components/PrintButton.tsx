"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button
      onClick={() => window.print()}
      className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2 print:hidden"
    >
      <Printer className="w-4 h-4" /> {label}
    </Button>
  );
}
