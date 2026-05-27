// Shared client-side PDF helpers.
//
// Two strategies are exposed:
//   - downloadHtmlAsPdf: snapshots a DOM node with html2canvas and embeds
//     the resulting image into a jsPDF document (preserves the on-screen
//     styling, best for visually rich reports).
//   - downloadStructuredPdf: builds a PDF from plain text + simple lines
//     using jsPDF's vector API directly. Smaller files, no canvas snapshot.

"use client";

import type { jsPDF as JsPdf } from "jspdf";

async function loadLibs() {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  return { jsPDF, html2canvas: html2canvasModule.default };
}

export async function downloadHtmlAsPdf(options: {
  element: HTMLElement;
  filename: string;
  /** Hex background colour used to fill page margins. Defaults to white. */
  pageBackground?: string;
}) {
  const { jsPDF, html2canvas } = await loadLibs();
  const { element, filename, pageBackground = "#ffffff" } = options;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: pageBackground,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 24;
  const printableWidth = pageWidth - margin * 2;
  const ratio = printableWidth / canvas.width;
  const printableHeight = canvas.height * ratio;

  if (printableHeight <= pageHeight - margin * 2) {
    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin,
      printableWidth,
      printableHeight,
    );
  } else {
    // Tall content: paginate by slicing the canvas vertically.
    const pageSliceHeightPx = Math.floor((pageHeight - margin * 2) / ratio);
    let yPx = 0;
    let isFirst = true;
    while (yPx < canvas.height) {
      const sliceHeight = Math.min(pageSliceHeightPx, canvas.height - yPx);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = pageBackground;
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        yPx,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );
      const sliceData = sliceCanvas.toDataURL("image/png");
      if (!isFirst) pdf.addPage();
      pdf.addImage(
        sliceData,
        "PNG",
        margin,
        margin,
        printableWidth,
        sliceHeight * ratio,
      );
      isFirst = false;
      yPx += sliceHeight;
    }
  }

  pdf.save(filename);
}

export type PdfTextLine =
  | { kind: "title"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "body"; text: string }
  | { kind: "label-value"; label: string; value: string }
  | { kind: "spacer"; size?: number }
  | { kind: "rule" }
  | { kind: "table"; headers: string[]; rows: string[][] };

export async function downloadStructuredPdf(options: {
  filename: string;
  lines: PdfTextLine[];
  /** Optional small text printed at the top of every page (e.g. school name). */
  header?: string;
  /** Optional small text printed at the bottom of every page. */
  footer?: string;
}) {
  const { jsPDF } = await loadLibs();
  const { filename, lines, header, footer } = options;
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;

  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      finishPage(pdf, { header, footer, pageWidth, pageHeight, margin });
      pdf.addPage();
      y = margin;
      drawHeader(pdf, header, pageWidth, margin);
    }
  };

  drawHeader(pdf, header, pageWidth, margin);

  for (const line of lines) {
    if (line.kind === "title") {
      ensureSpace(28);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text(line.text, margin, y);
      y += 26;
    } else if (line.kind === "subtitle") {
      ensureSpace(20);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139);
      pdf.text(line.text, margin, y);
      y += 18;
    } else if (line.kind === "heading") {
      ensureSpace(22);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text(line.text, margin, y);
      y += 18;
    } else if (line.kind === "body") {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(51, 65, 85);
      const wrapped = pdf.splitTextToSize(line.text, pageWidth - margin * 2);
      for (const t of wrapped) {
        ensureSpace(14);
        pdf.text(t, margin, y);
        y += 14;
      }
    } else if (line.kind === "label-value") {
      ensureSpace(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${line.label}: `, margin, y);
      const labelWidth = pdf.getTextWidth(`${line.label}: `);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(15, 23, 42);
      const wrapped = pdf.splitTextToSize(
        line.value,
        pageWidth - margin * 2 - labelWidth,
      );
      pdf.text(wrapped[0] ?? "", margin + labelWidth, y);
      y += 14;
      for (let i = 1; i < wrapped.length; i++) {
        ensureSpace(14);
        pdf.text(wrapped[i], margin + labelWidth, y);
        y += 14;
      }
    } else if (line.kind === "spacer") {
      y += line.size ?? 8;
    } else if (line.kind === "rule") {
      ensureSpace(8);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 12;
    } else if (line.kind === "table") {
      const cols = line.headers.length;
      const colWidth = (pageWidth - margin * 2) / cols;
      ensureSpace(28);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      for (let i = 0; i < cols; i++) {
        pdf.text(line.headers[i], margin + i * colWidth, y);
      }
      y += 6;
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 12;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(15, 23, 42);
      for (const row of line.rows) {
        const heights = row.map((cell, i) => {
          const wrapped = pdf.splitTextToSize(cell, colWidth - 8);
          return wrapped.length * 13;
        });
        const rowH = Math.max(...heights, 14);
        ensureSpace(rowH);
        for (let i = 0; i < cols; i++) {
          const wrapped = pdf.splitTextToSize(row[i] ?? "", colWidth - 8);
          let cy = y;
          for (const t of wrapped) {
            pdf.text(t, margin + i * colWidth, cy);
            cy += 13;
          }
        }
        y += rowH;
      }
      y += 6;
    }
  }

  finishPage(pdf, { header, footer, pageWidth, pageHeight, margin });
  pdf.save(filename);
}

function drawHeader(
  pdf: JsPdf,
  header: string | undefined,
  pageWidth: number,
  margin: number,
) {
  if (!header) return;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(header, margin, 28);
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, 34, pageWidth - margin, 34);
}

function finishPage(
  pdf: JsPdf,
  opts: {
    header?: string;
    footer?: string;
    pageWidth: number;
    pageHeight: number;
    margin: number;
  },
) {
  if (opts.footer) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(opts.footer, opts.margin, opts.pageHeight - 20);
  }
}
