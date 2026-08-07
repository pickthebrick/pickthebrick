// Shared quotation-PDF builder used both by the in-progress build cart
// (BuildClient.tsx) and the client dashboard's PDF-download button for an
// already-submitted quote (app/my-quotes/PdfDownloadButton.tsx). Browser-only
// (fetch/FileReader/canvas) - never import this from a server component.

export type QuotePdfItem = {
  name: string;
  categoryLabel: string;
  rate: number;
  qty: number;
  unitLabel: string;
};

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; ratio: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const ratio = bitmap.width / bitmap.height;
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, ratio };
  } catch {
    return null;
  }
}

export async function buildQuotePdf({
  items,
  grandTotal,
  location,
  officeSize,
  referenceNumber,
}: {
  items: QuotePdfItem[];
  grandTotal: number;
  location?: string | null;
  officeSize?: string | null;
  referenceNumber?: string | null;
}) {
  const { jsPDF } = await import("jspdf");
  const { TERMS_AND_CONDITIONS } = await import("@/lib/terms");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const ACCENT: [number, number, number] = [239, 123, 87];
  const INK: [number, number, number] = [58, 54, 50];
  const MUTED: [number, number, number] = [117, 110, 99];
  const LINE: [number, number, number] = [221, 211, 191];

  let y = 44;

  const logo = await loadImageAsDataUrl("/logo.png");
  if (logo) {
    const logoWidth = 90;
    doc.addImage(logo.dataUrl, "PNG", 40, y - 22, logoWidth, logoWidth / logo.ratio);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...INK);
    doc.text("PickTheBrick", 40, y);
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  if (referenceNumber) {
    doc.text("Reference: " + referenceNumber, pageWidth - 40, y - 20, { align: "right" });
  }
  doc.text("Quotation Date: " + new Date().toLocaleDateString(), pageWidth - 40, y - 10, { align: "right" });
  doc.text("Items: " + items.length, pageWidth - 40, y + 4, { align: "right" });

  y += 34;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.5);
  doc.line(40, y, pageWidth - 40, y);
  y += 20;

  if (location || officeSize) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text("Location:", 40, y);
    doc.text("Office size:", 220, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(location || "-", 95, y);
    doc.text(officeSize || "-", 285, y);
    y += 22;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(1);
    doc.line(40, y - 8, pageWidth - 40, y - 8);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Item", 40, y);
  doc.text("Category", 200, y);
  doc.text("Qty", 340, y);
  doc.text("Rate", 410, y);
  doc.text("Amount", 480, y);
  y += 8;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(40, y, pageWidth - 40, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  items.forEach((l) => {
    const amt = l.rate * l.qty;
    const nameLines = doc.splitTextToSize(l.name, 145);
    doc.setTextColor(...INK);
    doc.text(nameLines, 40, y);
    doc.setTextColor(...MUTED);
    doc.text(l.categoryLabel, 200, y);
    doc.text(String(l.qty) + " " + l.unitLabel, 340, y);
    doc.text("AED " + l.rate, 410, y);
    doc.setTextColor(...INK);
    doc.text("AED " + amt.toLocaleString(), 480, y);
    y += Math.max(16, nameLines.length * 12 + 4);
    doc.setDrawColor(...LINE);
    doc.line(40, y - 6, pageWidth - 40, y - 6);
  });

  y += 10;
  doc.setDrawColor(...INK);
  doc.line(320, y, pageWidth - 40, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", 320, y);
  doc.setTextColor(...ACCENT);
  doc.text("AED " + grandTotal.toLocaleString(), 480, y);

  y += 40;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Placeholder pricing - prototype only. Full terms & conditions on the final page.", 40, y);

  // ---- terms & conditions page ----
  doc.addPage();
  let ty = 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text("Terms & Conditions", 40, ty);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.5);
  ty += 12;
  doc.line(40, ty, pageWidth - 40, ty);
  ty += 26;

  TERMS_AND_CONDITIONS.forEach((clause) => {
    const bodyLines = doc.splitTextToSize(clause.body, pageWidth - 80);
    const blockHeight = 16 + bodyLines.length * 12 + 10;
    if (ty + blockHeight > pageHeight - 50) {
      doc.addPage();
      ty = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(clause.heading, 40, ty);
    ty += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(bodyLines, 40, ty);
    ty += bodyLines.length * 12 + 14;
  });

  return doc;
}
