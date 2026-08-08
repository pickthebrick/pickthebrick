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
  imageUrl?: string | null;
  // Used only as a thumbnail fallback (matches ProductThumb.tsx's picsum
  // placeholder) when the product has no admin-uploaded image yet.
  productId?: string | null;
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

function placeholderImageUrl(productId: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(productId + "-0")}/400/300`;
}

const VAT_RATE = 0.05;

export async function buildQuotePdf({
  items,
  grandTotal,
  location,
  officeSize,
  referenceNumber,
  clientName,
}: {
  items: QuotePdfItem[];
  grandTotal: number;
  location?: string | null;
  officeSize?: string | null;
  referenceNumber?: string | null;
  // "Name" or "Name - Company", matching the label already shown to the
  // captain when editing a client's quote (see app/build/page.tsx).
  clientName?: string | null;
}) {
  const { jsPDF } = await import("jspdf");
  const { TERMS_AND_CONDITIONS } = await import("@/lib/terms");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fully monochrome palette - no accent color, just ink/muted/line greys.
  const INK: [number, number, number] = [40, 38, 35];
  const MUTED: [number, number, number] = [128, 122, 112];
  const LINE: [number, number, number] = [225, 220, 209];
  const DARK_GREY: [number, number, number] = [68, 64, 58];

  const MARGIN = 40;
  const RIGHT = pageWidth - MARGIN;

  // Preload every thumbnail up front - jsPDF draws synchronously, so images
  // have to be resolved before laying out rows (same for the logo below).
  // Falls back to the same placeholder-photo seed ProductThumb.tsx uses when
  // a product has no admin-uploaded image, so the PDF matches what the
  // client actually saw while building the quote instead of an empty box.
  const effectiveUrls = items.map((i) => i.imageUrl || (i.productId ? placeholderImageUrl(i.productId) : null));
  const imageCache = new Map<string, { dataUrl: string; ratio: number }>();
  await Promise.all(
    Array.from(new Set(effectiveUrls.filter((u): u is string => !!u))).map(async (url) => {
      const img = await loadImageAsDataUrl(url);
      if (img) imageCache.set(url, img);
    }),
  );

  function drawThumbnail(dataUrl: string, ratio: number, x: number, yTop: number, box: number) {
    const w = ratio >= 1 ? box : box * ratio;
    const h = ratio >= 1 ? box / ratio : box;
    const format = dataUrl.startsWith("data:image/png") ? "PNG" : dataUrl.startsWith("data:image/webp") ? "WEBP" : "JPEG";
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.75);
    doc.rect(x, yTop, box, box);
    doc.addImage(dataUrl, format, x + (box - w) / 2, yTop + (box - h) / 2, w, h);
  }

  // Column grid: labels left-aligned, numbers right-aligned to a fixed edge
  // so every row lines up regardless of digit count.
  const COL = {
    thumb: MARGIN,
    thumbBox: 26,
    item: MARGIN + 26 + 12,
    itemWidth: 150,
    category: MARGIN + 26 + 12 + 150 + 10,
    categoryWidth: 90,
    qtyRight: MARGIN + 26 + 12 + 150 + 10 + 90 + 60,
    rateRight: MARGIN + 26 + 12 + 150 + 10 + 90 + 60 + 90,
    amountRight: RIGHT,
  };

  let y = 48;

  const logo = await loadImageAsDataUrl("/logo.png");
  if (logo) {
    const logoWidth = 82;
    doc.addImage(logo.dataUrl, "PNG", MARGIN, y - 20, logoWidth, logoWidth / logo.ratio);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...INK);
    doc.text("PickTheBrick", MARGIN, y);
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  if (referenceNumber) {
    doc.text("Reference " + referenceNumber, RIGHT, y - 18, { align: "right" });
  }
  doc.text(new Date().toLocaleDateString(), RIGHT, y - 6, { align: "right" });

  y += 30;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(MARGIN, y, RIGHT, y);
  y += 22;

  if (clientName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("PREPARED FOR", MARGIN, y);
    y += 13;
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(clientName, MARGIN, y);
    y += 18;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, RIGHT, y);
    y += 24;
  }

  if (location || officeSize) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("LOCATION", MARGIN, y);
    doc.text("OFFICE SIZE", MARGIN + 220, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(location || "-", MARGIN, y);
    doc.text(officeSize || "-", MARGIN + 220, y);
    y += 18;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, RIGHT, y);
    y += 24;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("ITEM", COL.item, y);
  doc.text("CATEGORY", COL.category, y);
  doc.text("QTY", COL.qtyRight, y, { align: "right" });
  doc.text("UNIT PRICE", COL.rateRight, y, { align: "right" });
  doc.text("AMOUNT", COL.amountRight, y, { align: "right" });
  y += 10;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(MARGIN, y, RIGHT, y);
  y += 18;

  items.forEach((l) => {
    const amt = l.rate * l.qty;
    const nameLines = doc.splitTextToSize(l.name, COL.itemWidth);
    const categoryLines = doc.splitTextToSize(l.categoryLabel, COL.categoryWidth);
    const textHeight = Math.max(nameLines.length, categoryLines.length) * 12;
    const rowHeight = Math.max(COL.thumbBox, textHeight);

    const effectiveUrl = l.imageUrl || (l.productId ? placeholderImageUrl(l.productId) : null);
    const img = effectiveUrl ? imageCache.get(effectiveUrl) : undefined;
    if (img) {
      drawThumbnail(img.dataUrl, img.ratio, COL.thumb, y, COL.thumbBox);
    } else {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.75);
      doc.rect(COL.thumb, y, COL.thumbBox, COL.thumbBox);
    }

    const textY = y + 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(nameLines, COL.item, textY);
    doc.setTextColor(...MUTED);
    doc.text(categoryLines, COL.category, textY);
    doc.text(String(l.qty) + " " + l.unitLabel, COL.qtyRight, textY, { align: "right" });
    doc.text("AED " + l.rate.toLocaleString(), COL.rateRight, textY, { align: "right" });
    doc.setTextColor(...INK);
    doc.text("AED " + amt.toLocaleString(), COL.amountRight, textY, { align: "right" });

    y += rowHeight + 12;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y - 6, RIGHT, y - 6);
  });

  y += 10;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(RIGHT - 200, y, RIGHT, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED);
  doc.text("TOTAL", RIGHT - 200, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...DARK_GREY);
  doc.text("AED " + grandTotal.toLocaleString(), RIGHT, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text("VAT (5%)", RIGHT - 200, y);
  doc.text("AED " + Math.round(grandTotal * VAT_RATE).toLocaleString(), RIGHT, y, { align: "right" });
  y += 26;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Placeholder pricing - prototype only. Full terms & conditions on the final page.", MARGIN, y);

  // ---- terms & conditions page ----
  doc.addPage();
  let ty = 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text("Terms & Conditions", MARGIN, ty);
  ty += 12;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(MARGIN, ty, RIGHT, ty);
  ty += 26;

  TERMS_AND_CONDITIONS.forEach((clause) => {
    const bodyLines = doc.splitTextToSize(clause.body, pageWidth - MARGIN * 2);
    const blockHeight = 16 + bodyLines.length * 12 + 10;
    if (ty + blockHeight > pageHeight - 50) {
      doc.addPage();
      ty = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(clause.heading, MARGIN, ty);
    ty += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(bodyLines, MARGIN, ty);
    ty += bodyLines.length * 12 + 14;
  });

  return doc;
}
