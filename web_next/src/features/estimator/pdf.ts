'use client';

import jsPDF from 'jspdf';
import { SITE } from '@/constants/site';
import { AREA_UNITS, FLOOR_OPTIONS, PROPERTY_TYPES, ASSUMPTIONS } from '@/constants/estimator';
import { formatDate, formatNumber } from '@/lib/format';
import type { Quote, QuoteInput } from './quote';

const NAVY: [number, number, number] = [10, 27, 77];
const CYAN: [number, number, number] = [0, 174, 239];
const GREY: [number, number, number] = [110, 118, 135];
const LIGHT: [number, number, number] = [232, 234, 240];

/* jsPDF's built-in Helvetica has no rupee glyph, so amounts print as "Rs" —
   the old PDF had the same constraint. */
const inr = (n: number) => `Rs ${formatNumber(Math.round(n))}`;

/**
 * Branded civil-work estimate — the quantities are the document.
 *
 * Vector primitives rather than html2canvas: a real text PDF (selectable,
 * ~30 KB) that renders identically everywhere. One page, on purpose: a
 * shopping list a client can hold next to any contractor's quote.
 */
export function generateCivilPdf(quote: Quote, input: QuoteInput, lead: { name: string; phone: string; email?: string }) {
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
  doc.text(input.package === 'semi-furnished' ? 'Semi Furnished Estimate' : 'Civil Work Estimate', W - M, 46, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  doc.setTextColor(190, 200, 220);
  doc.text(`Generated ${formatDate(new Date())}`, W - M, 60, { align: 'right' });
  doc.text('Indicative — not a quotation', W - M, 72, { align: 'right' });

  y = 138;

  /* ---------------- Prepared for / project ---------------- */
  const unitLabel = AREA_UNITS.find((u) => u.key === input.areaUnit)?.label ?? input.areaUnit;
  const floorsLabel = FLOOR_OPTIONS.find((f) => f.value === input.floors)?.label ?? `${input.floors} floors`;
  const typeLabel = PROPERTY_TYPES.find((t) => t.key === input.propertyType)?.label ?? input.propertyType;

  doc.setFont('helvetica', 'bold').setFontSize(8);
  setColor(GREY);
  doc.text('PREPARED FOR', M, y);
  doc.text('PROJECT', W / 2 + 20, y);
  doc.setFont('helvetica', 'bold').setFontSize(13);
  setColor(NAVY);
  doc.text(lead.name || 'Prospective client', M, y + 17);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(GREY);
  doc.text([lead.phone, lead.email].filter(Boolean).join('  ·  '), M, y + 31);
  doc.text(`${typeLabel} · ${formatNumber(input.areaPerFloor)} ${unitLabel} per floor · ${floorsLabel}`, W / 2 + 20, y + 17);
  doc.text(
    `Built-up area ${formatNumber(quote.builtUpArea)} sq ft · ${input.package === 'semi-furnished' ? 'Structure + finishing' : 'Civil structure only'}`,
    W / 2 + 20,
    y + 31,
  );

  y += 56;

  /* ---------------- The range ---------------- */
  setFill([245, 247, 252]);
  doc.roundedRect(M, y, W - 2 * M, 64, 6, 6, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8);
  setColor(GREY);
  doc.text(input.package === 'semi-furnished' ? 'ESTIMATED SEMI FURNISHED COST' : 'ESTIMATED CIVIL COST', M + 18, y + 20);
  doc.setFont('helvetica', 'bold').setFontSize(19);
  setColor(NAVY);
  doc.text(`${inr(quote.totalMin)}  –  ${inr(quote.totalMax)}`, M + 18, y + 44);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(GREY);
  /* No timeline on any visitor-facing surface — the firm commits none. The
     computed timelineWeeks still reaches the lead record for internal use. */
  doc.text(`about ${inr(quote.total / Math.max(quote.builtUpArea, 1))} per sq ft all-in`, W - M - 18, y + 32, { align: 'right' });

  y += 92;

  /* ---------------- Quantities table ---------------- */
  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(NAVY);
  doc.text('Materials your structure needs', M, y);
  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  setColor(GREY);
  doc.text(`Quantities include a ${quote.wastagePct}% wastage buffer`, W - M, y, { align: 'right' });
  y += 14;

  const col = { label: M, qty: W - M - 250, rate: W - M - 130, amount: W - M };
  setFill(LIGHT);
  doc.rect(M, y, W - 2 * M, 20, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8);
  setColor(GREY);
  doc.text('MATERIAL', col.label + 8, y + 13);
  doc.text('QUANTITY', col.qty, y + 13, { align: 'right' });
  doc.text('RATE', col.rate, y + 13, { align: 'right' });
  doc.text('AMOUNT', col.amount - 8, y + 13, { align: 'right' });
  y += 20;

  /* Seventeen semi-furnished lines must still fit one A4, so the row goes
     dense (no note sub-line) whenever the list is long. */
  const dense = quote.lines.length > 10;
  const rowH = dense ? 21 : 32;
  let lastGroup = '';
  for (const line of quote.lines) {
    if (dense && line.group !== lastGroup) {
      lastGroup = line.group;
      doc.setFont('helvetica', 'bold').setFontSize(7.5);
      setColor(GREY);
      doc.text(line.group === 'structure' ? 'STRUCTURE' : 'FINISHING', col.label + 8, y + 12);
      y += 16;
    }
    doc.setFont('helvetica', 'bold').setFontSize(9);
    setColor(NAVY);
    doc.text(line.label, col.label + 8, y + 13);
    if (!dense) {
      doc.setFont('helvetica', 'normal').setFontSize(7.5);
      setColor(GREY);
      doc.text(`${line.chosen.label}${line.chosen.detail ? ' ' + line.chosen.detail : ''} — ${line.note}`, col.label + 8, y + 24);
    }
    doc.setFont('helvetica', 'normal').setFontSize(9);
    setColor(NAVY);
    doc.text(`${formatNumber(line.qty)} ${line.unit}`, col.qty, y + 13, { align: 'right' });
    setColor(GREY);
    doc.text(inr(line.rate), col.rate, y + 13, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    setColor(NAVY);
    doc.text(inr(line.amount), col.amount - 8, y + 13, { align: 'right' });
    y += rowH;
    doc.setDrawColor(LIGHT[0], LIGHT[1], LIGHT[2]).setLineWidth(0.5);
    doc.line(M, y, W - M, y);
  }

  const totalRow = (label: string, sub: string, amount: number, bold = false) => {
    y += 4;
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(9.5);
    setColor(NAVY);
    doc.text(label, col.label + 8, y + 12);
    if (sub) {
      doc.setFont('helvetica', 'normal').setFontSize(7.5);
      setColor(GREY);
      doc.text(sub, col.label + 8 + doc.getTextWidth(label) + 90, y + 12);
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(9.5);
    setColor(NAVY);
    doc.text(inr(amount), col.amount - 8, y + 12, { align: 'right' });
    y += 18;
  };

  totalRow('Materials', '', quote.materialsTotal);
  totalRow('Labour', `${inr(quote.labour.rate)} / sq ft`, quote.labour.amount);
  totalRow('Site overheads', `shuttering, scaffolding, curing, transport, supervision — ${quote.overheads.pct}%`, quote.overheads.amount);
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]).setLineWidth(1);
  doc.line(M, y + 2, W - M, y + 2);
  totalRow('Total', '', quote.total, true);

  /* ---------------- Assumptions ---------------- */
  y += 16;
  doc.setFont('helvetica', 'bold').setFontSize(8);
  setColor(GREY);
  doc.text('ASSUMPTIONS', M, y);
  y += 11;
  doc.setFont('helvetica', 'normal').setFontSize(7.5);
  for (const a of (dense ? ASSUMPTIONS.slice(0, 3) : ASSUMPTIONS)) {
    const wrapped = doc.splitTextToSize(`·  ${a}`, W - 2 * M) as string[];
    doc.text(wrapped, M, y + 9);
    y += wrapped.length * 9.5 + 2;
  }

  /* ---------------- Footer ---------------- */
  setFill(NAVY);
  doc.rect(0, H - 54, W, 54, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(SITE.name, M, H - 32);
  doc.setFont('helvetica', 'normal').setFontSize(8.5);
  doc.setTextColor(190, 200, 220);
  doc.text(`${SITE.phone}  ·  ${SITE.email}  ·  ${SITE.url.replace('https://', '')}`, M, H - 18);
  setColor(CYAN);
  doc.text('Free site visit & detailed quotation on request', W - M, H - 24, { align: 'right' });

  doc.save(`NeetuArchstone-Civil-Estimate-${quote.builtUpArea}sqft.pdf`);
}
