'use client';

/**
 * Colourful material illustrations — September 2026.
 *
 * The client wanted the estimator's materials to read at a glance the way
 * competitor calculators do: a red brick stack you recognise before you read
 * the word. These are original drawings (flat fills, soft tones, 48×48 grid),
 * authored here rather than lifted from anywhere — competitor asset files are
 * their copyright, and stock packs carry licences this repo can't verify.
 *
 * Deliberately a separate component from MaterialIcon (the monochrome line
 * set): that one follows Lucide's stroke grammar and inherits currentColor
 * for chrome-ish contexts; these are fixed-palette artwork for the estimator
 * tiles and would be wrong to theme. Keyed by the engine's line keys.
 */

const ART: Record<string, React.ReactNode> = {
  /* Cement — a kraft paper sack, top seam folded, band label. */
  cement: (
    <>
      <path d="M10 16c0-2 1.4-3.5 3.4-3.5h21.2c2 0 3.4 1.5 3.4 3.5v22c0 2.2-1.8 4-4 4H14c-2.2 0-4-1.8-4-4V16Z" fill="#D9B98C" />
      <path d="M10 16c0-2 1.4-3.5 3.4-3.5h21.2c2 0 3.4 1.5 3.4 3.5v3.5H10V16Z" fill="#C6A272" />
      <path d="M15 12.5 13 8.5h22l-2 4H15Z" fill="#B08D5D" />
      <rect x="10" y="24" width="28" height="9" fill="#F5EFE6" />
      <rect x="14" y="26.5" width="14" height="4" rx="1" fill="#8C6F49" />
      <circle cx="33.5" cy="28.5" r="2.6" fill="#C0392B" />
    </>
  ),

  /* TMT Steel — a bundle of ribbed bars, bound twice, seen at an angle. */
  steel: (
    <>
      <g stroke="#6B7F94" strokeWidth="3.6" strokeLinecap="round">
        <path d="M9 34 36 12" />
        <path d="M13 38 40 16" />
        <path d="M17 41 42 21" />
      </g>
      <g stroke="#3E5468" strokeWidth="1.1" strokeLinecap="round">
        <path d="M14 30l2.4 2.8M19 26l2.4 2.8M24 22l2.4 2.8M29 18l2.4 2.8" />
        <path d="M20 35l2.2 2.6M25 31l2.2 2.6M30 27l2.2 2.6M35 23l2.2 2.6" />
      </g>
      <path d="M14 40.5 10.5 33l4-3.2 5 6.4-5.5 4.3Z" fill="#37648F" />
      <path d="M40 18.5 36 11l4-3.2 4.6 6.6-4.6 4.1Z" fill="#37648F" />
    </>
  ),

  /* Bricks — a stretcher-bond stack in terracotta. */
  bricks: (
    <>
      <g stroke="#FFF" strokeWidth="1.6">
        <rect x="8" y="12" width="15" height="8" rx="1" fill="#C4553B" />
        <rect x="25" y="12" width="15" height="8" rx="1" fill="#B34A32" />
        <rect x="16.5" y="21.5" width="15" height="8" rx="1" fill="#C4553B" />
        <rect x="8" y="21.5" width="6.5" height="8" rx="1" fill="#A84430" />
        <rect x="33.5" y="21.5" width="6.5" height="8" rx="1" fill="#B34A32" />
        <rect x="8" y="31" width="15" height="8" rx="1" fill="#B34A32" />
        <rect x="25" y="31" width="15" height="8" rx="1" fill="#C4553B" />
      </g>
    </>
  ),

  /* Sand — a golden heap with a small shovel handle. */
  sand: (
    <>
      <path d="M5.5 38c3.6-9.8 9.6-16 18.5-16s14.9 6.2 18.5 16H5.5Z" fill="#E9C270" />
      <path d="M12 38c2.8-6.6 6.8-10.4 12-10.4S33.2 31.4 36 38H12Z" fill="#D9AC53" />
      <path d="M31 15.5 36.5 10l3 3-5.5 5.5-3-3Z" fill="#8C6F49" />
      <path d="M28.4 21.8c-2.2 2.2-5 2.4-6.7.7-1.7-1.7-1.5-4.5.7-6.7l3.4-3.1 5.7 5.7-3.1 3.4Z" fill="#AEB6BF" />
      <circle cx="15" cy="33" r="1" fill="#B8934A" />
      <circle cx="24" cy="30" r="1" fill="#B8934A" />
      <circle cx="31" cy="34" r="1" fill="#B8934A" />
    </>
  ),

  /* Aggregate — graded grey stones. */
  aggregate: (
    <>
      <path d="m13 20 7-6 7 4-2.5 8-8.5 1L13 20Z" fill="#9AA5B1" />
      <path d="m28 17 6-3.5L39.5 19l-2 7-7-1.5L28 17Z" fill="#7F8B99" />
      <path d="m9 32 5.5-4.5 6.5 2.5-1.5 7H11L9 32Z" fill="#8894A3" />
      <path d="m23 31 6.5-3 6 4-2.5 6h-8l-2-7Z" fill="#A8B2BD" />
      <circle cx="20" cy="17" r="1.1" fill="#6E7A88" />
      <circle cx="33" cy="21" r="1.1" fill="#5F6B79" />
      <circle cx="15" cy="32.5" r="1.1" fill="#6E7A88" />
    </>
  ),

  /* Foundation stone — coursed rubble blocks in warm grey. */
  stone: (
    <>
      <g stroke="#FFF" strokeWidth="1.6">
        <path d="M9 30h13l2 9H11l-2-9Z" fill="#A3927B" />
        <path d="M24 30h15l-1 9H26l-2-9Z" fill="#8F7E68" />
        <path d="M12 20h11l1.5 8H13.5L12 20Z" fill="#8F7E68" />
        <path d="M25 20h11l1 8H26.5L25 20Z" fill="#A3927B" />
        <path d="M16 11h15l1 7H17l-1-7Z" fill="#B4A48D" />
      </g>
    </>
  ),

  /* Waterproofing — a bold droplet under a sheltering roofline. */
  waterproofing: (
    <>
      <path d="M8 20 24 8l16 12" fill="none" stroke="#5B6B7C" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 17c4.6 5.6 8 9.9 8 14a8 8 0 1 1-16 0c0-4.1 3.4-8.4 8-14Z" fill="#3FA8E0" />
      <path d="M20.5 31.5c0 2 .9 3.6 2.6 4.4" fill="none" stroke="#BFE6F8" strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  /* Flooring — large vitrified tiles in perspective, one being laid. */
  flooring: (
    <>
      <path d="M4 30 24 20l20 10-20 10L4 30Z" fill="#D8CDBE" />
      <path d="M4 30v4l20 10v-4L4 30Z" fill="#B9AC99" />
      <path d="M44 30v4L24 44v-4l20-10Z" fill="#C7BBA9" />
      <g stroke="#FFF" strokeWidth="1.4">
        <path d="M14 25l20 10M24 20l20 10M14 35l20-10" fill="none" />
      </g>
      <path d="M28 8l10 5-10 5-10-5 10-5Z" fill="#E8DFD3" stroke="#B9AC99" strokeWidth="1" />
    </>
  ),

  /* Wall finish — a roller leaving a fresh band of paint. */
  'wall-finish': (
    <>
      <rect x="6" y="6" width="14" height="36" fill="#7FC5E8" />
      <rect x="6" y="6" width="14" height="36" fill="none" stroke="#5FA9CF" strokeWidth="1.2" />
      <rect x="17" y="10" width="12" height="7" rx="2" fill="#4A90B8" />
      <path d="M29 13h6v4l-4 3" fill="none" stroke="#8C6F49" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 20v10" stroke="#8C6F49" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M28 30h6v8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8Z" fill="#C0392B" />
    </>
  ),

  /* Doors — a panelled door ajar in its frame. */
  doors: (
    <>
      <path d="M10 6h28v38H10z" fill="#D9CBB8" />
      <path d="M14 10h20v34H14z" fill="#A9703C" />
      <rect x="17" y="14" width="14" height="10" rx="1" fill="#8C5A2E" />
      <rect x="17" y="27" width="14" height="12" rx="1" fill="#8C5A2E" />
      <circle cx="29.5" cy="26" r="1.6" fill="#F2C94C" />
    </>
  ),

  /* Grills — a safety grill of verticals with a scroll motif. */
  grills: (
    <>
      <rect x="8" y="8" width="32" height="32" rx="2" fill="none" stroke="#5B6B7C" strokeWidth="2.4" />
      <g stroke="#5B6B7C" strokeWidth="2" strokeLinecap="round">
        <path d="M16 8v32M24 8v32M32 8v32" />
      </g>
      <path d="M12 24c4-4 8 4 12 0s8 4 12 0" fill="none" stroke="#8FA1B3" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),

  /* Windows — a two-light casement with sky and an open pane. */
  windows: (
    <>
      <rect x="7" y="9" width="34" height="30" rx="2" fill="#F5EFE6" stroke="#B9AC99" strokeWidth="1.5" />
      <rect x="11" y="13" width="12" height="22" fill="#AEDCF2" />
      <rect x="25" y="13" width="12" height="22" fill="#8FCDEB" />
      <path d="M25 13l8 22" stroke="#FFF" strokeWidth="1.4" />
      <path d="M11 21h12M17 13v22" stroke="#FFF" strokeWidth="1.4" />
    </>
  ),

  /* Conduiting — orange conduit runs with a junction box. */
  conduiting: (
    <>
      <path d="M6 34h16a4 4 0 0 0 4-4V14a4 4 0 0 1 4-4h12" fill="none" stroke="#E67E22" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M6 40h18a8 8 0 0 0 8-8v-6" fill="none" stroke="#F0A252" strokeWidth="3" strokeLinecap="round" />
      <rect x="34" y="6" width="9" height="9" rx="1.5" fill="#5B6B7C" />
      <circle cx="38.5" cy="10.5" r="1.6" fill="#F5EFE6" />
    </>
  ),

  /* Electrical — a modular switch plate, one rocker on. */
  electrical: (
    <>
      <rect x="10" y="8" width="28" height="32" rx="3" fill="#F5EFE6" stroke="#C9BCA8" strokeWidth="1.4" />
      <rect x="15" y="14" width="8" height="12" rx="1.5" fill="#FFF" stroke="#B9AC99" strokeWidth="1.2" />
      <rect x="25" y="14" width="8" height="12" rx="1.5" fill="#2AA7DF" />
      <rect x="26.5" y="15.5" width="5" height="4.5" rx="1" fill="#BFE6F8" />
      <circle cx="24" cy="33" r="3.2" fill="#FFF" stroke="#B9AC99" strokeWidth="1.2" />
      <circle cx="24" cy="33" r="1" fill="#5B6B7C" />
    </>
  ),

  /* Plumbing — a CPVC run with an elbow and a tap. */
  plumbing: (
    <>
      <path d="M6 16h20a4 4 0 0 1 4 4v22" fill="none" stroke="#C8963E" strokeWidth="5" strokeLinecap="round" />
      <path d="M6 16h20a4 4 0 0 1 4 4v22" fill="none" stroke="#E8B45C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34 12h6M37 9v6" stroke="#5B6B7C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M37 15v5a3 3 0 0 1-3 3" fill="none" stroke="#5B6B7C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34 26c1.4 2 2.4 3.4 2.4 4.6a2.4 2.4 0 1 1-4.8 0c0-1.2 1-2.6 2.4-4.6Z" fill="#3FA8E0" />
    </>
  ),

  /* Bathroom — a basin on a pedestal with a mixer. */
  bathroom: (
    <>
      <path d="M10 22h28v4a12 10 0 0 1-12 8h-4a12 10 0 0 1-12-8v-4Z" fill="#F5F8FA" stroke="#B9C6D1" strokeWidth="1.4" />
      <path d="M20 34h8l-2 8h-4l-2-8Z" fill="#DCE6ED" />
      <path d="M24 12v6M20 12h8" stroke="#5B6B7C" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="25" r="1.6" fill="#8FA1B3" />
    </>
  ),

  /* Water tank — the rib-walled overhead tank on a stand. */
  'water-tank': (
    <>
      <path d="M12 10h24v22a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V10Z" fill="#3B3F45" />
      <path d="M12 10h24v5H12z" fill="#54595F" />
      <g stroke="#54595F" strokeWidth="1.6">
        <path d="M12 20h24M12 26h24M12 32h24" />
      </g>
      <rect x="20" y="6" width="8" height="4" rx="1" fill="#54595F" />
      <path d="M15 36v6M33 36v6" stroke="#5B6B7C" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
};

export function MaterialArt({ name, className }: { name: string; className?: string }) {
  const art = ART[name];
  if (!art) return null;

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      {art}
    </svg>
  );
}
