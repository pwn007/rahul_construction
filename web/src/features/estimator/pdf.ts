import jsPDF from 'jspdf';
import type { EstimateResult } from './model';
import { MATERIAL_GROUPS, QUANTITY_UNIT_LABEL } from '@/constants/materials';
import { SITE } from '@/constants/site';
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber } from '@/lib/format';

const NAVY: [number, number, number] = [10, 27, 77];
const CYAN: [number, number, number] = [0, 174, 239];
const GREY: [number, number, number] = [110, 118, 135];
const LIGHT: [number, number, number] = [232, 234, 240];

/**
 * Branded PDF estimate.
 *
 * Built with vector primitives rather than html2canvas: the output is a real
 * text-based PDF (selectable, searchable, ~30 KB) instead of a screenshot,
 * and it renders identically regardless of the user's screen.
 */
export function generateEstimatePdf(result: EstimateResult, lead: { name: string; phone: string; email?: string }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = 0;

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);

  /* ---------------- Header ---------------- */
  setFill(NAVY);
  doc.rect(0, 0, W, 108, 'F');

  setFill(CYAN);
  doc.rect(M, 32, 9, 22, 'F');
  setFill([255, 255, 255]);
  doc.rect(M + 13, 38, 9, 22, 'F');

  doc.setFont('helvetica', 'bold').setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Neetu', M + 32, 50);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(CYAN);
  doc.text('A R C H S T O N E', M + 32, 63);

  doc.setFont('helvetica', 'bold').setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('Construction Cost Estimate', W - M, 46, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  doc.setTextColor(190, 200, 220);
  doc.text(`Generated ${formatDate(new Date())}`, W - M, 60, { align: 'right' });
  doc.text('Indicative — not a quotation', W - M, 72, { align: 'right' });

  y = 140;

  /* ---------------- Prepared for ---------------- */
  doc.setFont('helvetica', 'bold').setFontSize(8);
  setColor(GREY);
  doc.text('PREPARED FOR', M, y);
  doc.setFont('helvetica', 'bold').setFontSize(13);
  setColor(NAVY);
  doc.text(lead.name || 'Prospective client', M, y + 17);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(GREY);
  doc.text([lead.phone, lead.email].filter(Boolean).join('  ·  '), M, y + 31);

  doc.setFont('helvetica', 'bold').setFontSize(8);
  doc.text('PROJECT', W / 2 + 20, y);
  doc.setFont('helvetica', 'normal').setFontSize(9.5);
  setColor(NAVY);
  doc.text(`${result.labels.propertyType} · ${result.labels.packageLabel}`, W / 2 + 20, y + 17);
  doc.text(`${result.labels.location} · ${result.labels.floors}`, W / 2 + 20, y + 31);

  y += 58;

  /* ---------------- Headline number ---------------- */
  setFill([247, 249, 252]);
  doc.roundedRect(M, y, W - M * 2, 92, 6, 6, 'F');
  setFill(CYAN);
  doc.rect(M, y, 3.5, 92, 'F');

  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  setColor(GREY);
  doc.text('ESTIMATED PROJECT COST', M + 22, y + 24);

  doc.setFont('helvetica', 'bold').setFontSize(26);
  setColor(NAVY);
  doc.text(`${formatCurrencyCompact(result.min)}  -  ${formatCurrencyCompact(result.max)}`, M + 22, y + 54);

  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(GREY);
  doc.text(
    `${formatCurrency(result.perSqft)} per sq ft  ·  ${formatNumber(result.chargeableArea)} sq ft chargeable  ·  ${result.timelineWeeks} weeks`,
    M + 22,
    y + 74,
  );

  y += 118;

  /* ---------------- Configuration ---------------- */
  const twoCol = (rows: [string, string][], startY: number) => {
    let ry = startY;
    rows.forEach(([label, value], i) => {
      const col = i % 2;
      const x = M + col * ((W - M * 2) / 2);
      if (col === 0 && i > 0) ry += 22;
      doc.setFont('helvetica', 'normal').setFontSize(8.5);
      setColor(GREY);
      doc.text(label, x, ry);
      doc.setFont('helvetica', 'bold').setFontSize(9.5);
      setColor(NAVY);
      doc.text(value, x, ry + 13);
    });
    return ry + 28;
  };

  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(NAVY);
  doc.text('Your configuration', M, y);
  y += 20;

  y = twoCol(
    [
      ['Service model', result.labels.serviceModel],
      ['Finish level', `${result.labels.packageLabel} — ${result.labels.packageHeadline}`],
      ['Area per floor', `${formatNumber(result.areaPerFloorSqft)} sq ft`],
      ['Built-up area', `${formatNumber(result.builtUpArea)} sq ft`],
      ['Floors', result.labels.floors],
      ['Material quality', result.labels.quality],
      ['Location', `${result.labels.location} (${result.labels.locationZone})`],
      ['Applied rate', `${formatCurrency(result.effectiveRate)} / sq ft`],
    ],
    y,
  );

  y += 10;

  /* ---------------- What you are paying for ---------------- */
  /* Commercial split first, matching the screen — it is the breakdown a client
     reads, where the construction heads below are the one a contractor reads. */
  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(NAVY);
  doc.text('What you are paying for', M, y);
  y += 18;

  setFill(LIGHT);
  doc.rect(M, y, W - M * 2, 20, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8.5);
  setColor(GREY);
  doc.text('COMPONENT', M + 10, y + 13.5);
  doc.text('SHARE', W - M - 150, y + 13.5, { align: 'right' });
  doc.text('AMOUNT', W - M - 10, y + 13.5, { align: 'right' });
  y += 20;

  result.commercial.forEach((head, i) => {
    if (i % 2 === 1) {
      setFill([250, 251, 253]);
      doc.rect(M, y, W - M * 2, 22, 'F');
    }
    doc.setFont('helvetica', 'normal').setFontSize(9.5);
    setColor(NAVY);
    doc.text(head.label, M + 10, y + 14.5);
    setColor(GREY);
    doc.setFontSize(9);
    doc.text(`${head.percent.toFixed(0)}%`, W - M - 150, y + 14.5, { align: 'right' });
    doc.setFont('helvetica', 'bold').setFontSize(9.5);
    setColor(NAVY);
    doc.text(formatCurrency(head.amount), W - M - 10, y + 14.5, { align: 'right' });
    y += 22;
  });

  y += 20;

  /* ---------------- Cost breakdown ---------------- */
  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(NAVY);
  doc.text('Cost breakdown by head', M, y);
  y += 18;

  setFill(LIGHT);
  doc.rect(M, y, W - M * 2, 20, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8.5);
  setColor(GREY);
  doc.text('HEAD', M + 10, y + 13.5);
  doc.text('SHARE', W - M - 150, y + 13.5, { align: 'right' });
  doc.text('AMOUNT', W - M - 10, y + 13.5, { align: 'right' });
  y += 20;

  result.heads.forEach((head, i) => {
    if (i % 2 === 1) {
      setFill([250, 251, 253]);
      doc.rect(M, y, W - M * 2, 22, 'F');
    }
    doc.setFont('helvetica', 'normal').setFontSize(9.5);
    setColor(NAVY);
    doc.text(head.label, M + 10, y + 14.5);
    setColor(GREY);
    doc.setFontSize(9);
    doc.text(`${head.percent.toFixed(1)}%`, W - M - 150, y + 14.5, { align: 'right' });
    doc.setFont('helvetica', 'bold').setFontSize(9.5);
    setColor(NAVY);
    doc.text(formatCurrency(head.amount), W - M - 10, y + 14.5, { align: 'right' });
    y += 22;
  });

  setFill(NAVY);
  doc.rect(M, y, W - M * 2, 26, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Total (point estimate)', M + 10, y + 17);
  doc.text(formatCurrency(result.total), W - M - 10, y + 17, { align: 'right' });
  y += 42;

  /* ---------------- Enhancements ---------------- */
  if (result.enhancementBreakdown.length) {
    doc.setFont('helvetica', 'bold').setFontSize(11);
    setColor(NAVY);
    doc.text('Selected enhancements', M, y);
    y += 16;
    result.enhancementBreakdown.forEach((item) => {
      doc.setFont('helvetica', 'normal').setFontSize(9);
      setColor(GREY);
      doc.text(`•  ${item.label}`, M + 6, y + 10);
      setColor(NAVY);
      doc.text(formatCurrency(item.amount), W - M - 10, y + 10, { align: 'right' });
      y += 16;
    });
    y += 12;
  }

  /* ---------------- Page 2 — itemised materials ---------------- */
  /* The quantities are the reason this page exists. A client can take "994 bags
     of cement at Rs 400" to a supplier and check it; they cannot check a lump. */
  if (result.materialLines.length) {
    doc.addPage();
    y = 60;

    doc.setFont('helvetica', 'bold').setFontSize(11);
    setColor(NAVY);
    doc.text('Itemised materials', M, y);
    y += 14;

    doc.setFont('helvetica', 'normal').setFontSize(8.5);
    setColor(GREY);
    doc.text(
      'Quantities use published thumb rules and are indicative. Final quantities come from approved drawings and a bar-bending schedule.',
      M,
      y + 8,
      { maxWidth: W - M * 2 },
    );
    y += 26;

    setFill(LIGHT);
    doc.rect(M, y, W - M * 2, 20, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(8.5);
    setColor(GREY);
    doc.text('MATERIAL', M + 10, y + 13.5);
    doc.text('SPECIFICATION', M + 150, y + 13.5);
    doc.text('QUANTITY', W - M - 230, y + 13.5, { align: 'right' });
    doc.text('RATE', W - M - 120, y + 13.5, { align: 'right' });
    doc.text('AMOUNT', W - M - 10, y + 13.5, { align: 'right' });
    y += 20;

    MATERIAL_GROUPS.forEach((group) => {
      const lines = result.materialLines.filter((l) => l.group === group.key);
      if (!lines.length) return;

      doc.setFont('helvetica', 'bold').setFontSize(8.5);
      setColor(CYAN);
      doc.text(group.label.toUpperCase(), M + 10, y + 12);
      y += 18;

      lines.forEach((line, i) => {
        if (i % 2 === 1) {
          setFill([250, 251, 253]);
          doc.rect(M, y, W - M * 2, 20, 'F');
        }
        doc.setFont('helvetica', 'normal').setFontSize(9);
        setColor(NAVY);
        doc.text(line.label, M + 10, y + 13.5);
        setColor(GREY);
        doc.setFontSize(8.5);
        doc.text(line.spec.slice(0, 48), M + 150, y + 13.5);
        doc.text(
          `${formatNumber(line.quantity)} ${QUANTITY_UNIT_LABEL[line.unit]}`,
          W - M - 230,
          y + 13.5,
          { align: 'right' },
        );
        doc.text(`${formatCurrency(line.unitRate)}`, W - M - 120, y + 13.5, { align: 'right' });
        doc.setFont('helvetica', 'bold').setFontSize(9);
        setColor(NAVY);
        doc.text(formatCurrency(line.amount), W - M - 10, y + 13.5, { align: 'right' });
        y += 20;
      });

      y += 6;
    });

    const materialsTotal = result.commercial.find((c) => c.key === 'materials')?.amount ?? 0;
    setFill(NAVY);
    doc.rect(M, y, W - M * 2, 26, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Total materials', M + 10, y + 17);
    doc.text(formatCurrency(materialsTotal), W - M - 10, y + 17, { align: 'right' });
    y += 42;
  }

  /* ---------------- Programme & payments ---------------- */
  doc.addPage();
  y = 60;

  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(NAVY);
  doc.text('Estimated programme', M, y);
  y += 18;

  const barX = M;
  const barW = W - M * 2;
  result.phases.forEach((phase) => {
    const w = (phase.weeks / result.timelineWeeks) * barW;
    const x = barX + (phase.startWeek / result.timelineWeeks) * barW;

    doc.setFont('helvetica', 'normal').setFontSize(9);
    setColor(NAVY);
    doc.text(phase.label, M, y + 9);
    setColor(GREY);
    doc.setFontSize(8.5);
    doc.text(`${phase.weeks} wk`, W - M, y + 9, { align: 'right' });

    setFill([236, 239, 244]);
    doc.roundedRect(barX, y + 14, barW, 7, 3.5, 3.5, 'F');
    setFill(CYAN);
    doc.roundedRect(x, y + 14, Math.max(w, 6), 7, 3.5, 3.5, 'F');
    y += 32;
  });

  doc.setFont('helvetica', 'bold').setFontSize(9.5);
  setColor(NAVY);
  doc.text(`Total: ${result.timelineWeeks} weeks from agreement to handover`, M, y + 4);
  y += 34;

  /* ---------------- Payment schedule ---------------- */
  doc.setFont('helvetica', 'bold').setFontSize(11);
  doc.text('Milestone payment schedule', M, y);
  y += 18;

  setFill(LIGHT);
  doc.rect(M, y, barW, 20, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8.5);
  setColor(GREY);
  doc.text('MILESTONE', M + 10, y + 13.5);
  doc.text('%', W - M - 130, y + 13.5, { align: 'right' });
  doc.text('AMOUNT', W - M - 10, y + 13.5, { align: 'right' });
  y += 20;

  result.payments.forEach((row, i) => {
    if (i % 2 === 1) {
      setFill([250, 251, 253]);
      doc.rect(M, y, barW, 24, 'F');
    }
    doc.setFont('helvetica', 'normal').setFontSize(9.5);
    setColor(NAVY);
    doc.text(row.milestone, M + 10, y + 11);
    doc.setFontSize(7.5);
    setColor(GREY);
    doc.text(row.trigger, M + 10, y + 20);
    doc.setFont('helvetica', 'normal').setFontSize(9);
    doc.text(`${row.percent}%`, W - M - 130, y + 15, { align: 'right' });
    doc.setFont('helvetica', 'bold').setFontSize(9.5);
    setColor(NAVY);
    doc.text(formatCurrency(row.amount), W - M - 10, y + 15, { align: 'right' });
    y += 24;
  });

  y += 24;

  /* ---------------- Assumptions ---------------- */
  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(NAVY);
  doc.text('Assumptions & exclusions', M, y);
  y += 16;

  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  setColor(GREY);
  result.assumptions.forEach((line) => {
    const wrapped = doc.splitTextToSize(`•  ${line}`, barW - 8) as string[];
    doc.text(wrapped, M + 4, y + 8);
    y += wrapped.length * 11 + 4;
  });

  /* ---------------- Footer on every page ---------------- */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    setFill(NAVY);
    doc.rect(0, H - 46, W, 46, 'F');
    doc.setFont('helvetica', 'normal').setFontSize(8);
    doc.setTextColor(190, 200, 220);
    doc.text(`${SITE.name}  ·  ${SITE.phone}  ·  ${SITE.email}`, M, H - 27);
    doc.text(SITE.address.full, M, H - 15);
    doc.text(`Page ${p} of ${pageCount}`, W - M, H - 27, { align: 'right' });
    setColor(CYAN);
    doc.text(SITE.tagline, W - M, H - 15, { align: 'right' });
  }

  const safeName = (lead.name || 'estimate').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`neetu-archstone-estimate-${safeName}.pdf`);
}
