import type { NextRequest } from "next/server";
import { createClient } from "@/supabase/server";
import { getChildMaterialById } from "@/lib/db/childMaterials";
import { opensInline } from "@/lib/materials";

// Child materials are streamed through the app rather than linked straight to
// storage, so the storage URL never reaches a browser and every read is
// authorised first. The authorisation IS the RLS read: child_materials is
// selectable only by the school's staff and by that one child's parents, so a
// row this caller may not see comes back null and the request 404s.

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
  txt: "text/plain; charset=utf-8",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Only our own storage host is ever fetched, whatever the row happens to hold. */
function isTrustedStorageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> },
) {
  const { materialId } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return new Response("Not configured", { status: 500 });
  }

  const material = await getChildMaterialById(supabase, materialId);
  if (!material || !isTrustedStorageUrl(material.file_url)) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(material.file_url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new Response("That file is no longer available.", { status: 502 });
  }

  // Everything downloads except the few formats a browser renders safely.
  const forced = request.nextUrl.searchParams.get("download") === "1";
  const disposition =
    forced || !opensInline(material.file_ext) ? "attachment" : "inline";
  // Quotes and newlines would break out of the header value.
  const safeName = material.file_name.replace(/["\\\r\n]/g, "") || "material";

  const headers = new Headers({
    "Content-Type":
      CONTENT_TYPES[material.file_ext] ??
      upstream.headers.get("content-type") ??
      "application/octet-stream",
    "Content-Disposition": `${disposition}; filename="${safeName}"`,
    // A child's document must never sit in a shared cache.
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}
