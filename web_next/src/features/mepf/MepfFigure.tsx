'use client';

import { motion } from 'framer-motion';
import { IMG } from '@/lib/media';
import { usePrefersReducedMotion } from '@/hooks';
import { SYSTEMS } from '@/data/mepf';
import { SYSTEM_STYLES } from './scene/systems';
import type { SystemKey } from '@/data/mepf';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Where each service actually sits in `mepf-09.webp`, as a percentage of the
 * frame.
 *
 * ── Three labels, not four ──────────────────────────────────────────────────
 * The section names four systems; this photograph can only prove three. The
 * round galvanised runs, the mesh cable tray and the red pipework are each
 * unambiguous at full resolution. Plumbing is not separable from the rest here,
 * so it gets no pin — a label pointing at something it is not is worse than no
 * label, and the fourth system is still named in the list beside the photo.
 *
 * ── These numbers belong to this photograph ─────────────────────────────────
 * Swap the image and every coordinate below is wrong. They live next to the
 * filename for that reason. Re-derive them by eye against a screenshot; there is
 * no shortcut.
 */
const PHOTO = 'home-mepf';
const TEAM_PHOTO = 'home-mepf-team';

const HOTSPOTS: { key: SystemKey; label: string; x: number; y: number; side: 'left' | 'right' }[] = [
  /* Mesh basket tray carrying the black cables, above and right of the worker. */
  { key: 'electrical', label: 'Cable tray', x: 66, y: 33, side: 'left' },
  /* Red is the standard fire-protection colour: this is the sprinkler main. */
  { key: 'fire', label: 'Sprinkler main', x: 89, y: 40, side: 'right' },
  /* The large smooth cylindrical runs along the bottom of the frame. */
  { key: 'hvac', label: 'Ductwork', x: 14, y: 77, side: 'left' },
];

/**
 * The home page's MEPF figure: a services photograph with the services in it
 * named, and an inset of the people who set them out.
 *
 * ── Why not `MaskImage` ─────────────────────────────────────────────────────
 * `MaskImage` scales its `<img>` to 1.12 to give the parallax somewhere to
 * travel. That silently moves every point in the frame, so a pin placed at 64%
 * of the photograph would not land at 64% of the box. Here the image sits at
 * scale 1 and the percentages mean what they say.
 *
 * The clip-path reveal is copied from `MaskImage` deliberately — same easing,
 * same duration, and the same rule that both variants must declare the same
 * properties, or a reduced-motion switch mid-flight strands the element at its
 * initial value.
 */
export function MepfFigure({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.figure
      className={`relative overflow-hidden rounded-xl shadow-md aspect-[3/2] ${className ?? ''}`}
      initial={{ opacity: reduced ? 0 : 1, clipPath: reduced ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }}
      whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: reduced ? 0.2 : 1.1, ease: EASE }}
    >
      <img
        src={IMG.wide(PHOTO)}
        alt="An electrician on a lift pulling cable into a ceiling device, with the mesh cable tray, red sprinkler main and ventilation ductwork all still open above him."
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />

      {/*
        Labels only from `lg`. Below that the photograph is half the width and
        three pills collide into mush — the four-item list beside it is the key
        at those sizes, and it is already there.

        `aria-hidden` because it is: every one of these words is in that list,
        and a screen reader does not need the same four names twice.
      */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        {HOTSPOTS.map(({ key, label, x, y, side }, i) => (
          /*
            Two elements, and they have to stay two.
  
            Positioning lives on this plain div, animation on the motion div
            inside it. Framer owns the `transform` of anything it animates, so a
            `translate(-100%, -50%)` written here alongside an animated `scale`
            is silently overwritten the moment the animation runs — which is
            exactly how the label first ran off the right edge of the frame.
  
            `right` rather than a negative translate for the right-hand pin: the
            box's right edge lands on `x`, and `flex-row-reverse` puts the dot at
            that edge, so the pill grows inwards and can never overflow.
          */
          <div
            key={key}
            className="absolute -translate-y-1/2"
            style={side === 'right' ? { right: `${100 - x}%`, top: `${y}%` } : { left: `${x}%`, top: `${y}%` }}
          >
          <motion.div
            className={`flex items-center gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}
            initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            /* After the photograph has finished wiping in — the picture first,
               then what the things in it are called. */
            transition={{ duration: reduced ? 0.2 : 0.45, delay: reduced ? 0 : 0.9 + i * 0.12, ease: EASE }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/70"
              style={{ backgroundColor: SYSTEM_STYLES[key].colour }}
            />
            <span className="h-px w-4 shrink-0 bg-white/70" />
            <span className="whitespace-nowrap rounded-full bg-ink-950/75 px-2.5 py-1 text-[0.72rem] font-medium leading-none text-white backdrop-blur-sm">
              {label}
              {/* The pill is at its widest at exactly `lg`, where the two-column
                  layout has just started and the figure is at its narrowest —
                  "Sprinkler main · Alarms & a way out" ran off the frame there.
                  The name alone still identifies the thing; what it does can
                  wait for the width to pay for it. */}
              <span className="ml-1.5 hidden text-white/60 xl:inline">{SYSTEMS[key].legend}</span>
            </span>
          </motion.div>
          </div>
        ))}
      </div>

      {/*
        The second half of the argument.
  
        The reference the client sent had dense services and a team of engineers
        in one frame; that photograph is a commissioned shoot, and free stock has
        no equivalent — the closest matches on Unsplash are all paid. Two
        photographs say the same thing: this is what MEPF looks like, and these
        are the people who set it out.
  
        Bottom-right, not bottom-left: `Ductwork` is pinned at 14%/77% and would
        be covered. `Sprinkler main` sits at 40%, well clear above.
      */}
      <motion.img
        src={IMG.wide(TEAM_PHOTO)}
        alt="Two engineers in hard hats and hi-vis reading a large drawing together on site."
        loading="lazy"
        decoding="async"
        /* Smaller on a phone. At 44% of a ~300px frame the inset swallowed the
           main photograph and the services behind it stopped reading — and
           the labels are hidden at that width, so the photograph is doing all
           the explaining on its own there. */
        className="absolute bottom-2.5 right-2.5 aspect-[4/3] w-[34%] max-w-[280px] rounded-lg object-cover shadow-lg ring-1 ring-white/25 sm:bottom-4 sm:right-4 sm:w-[40%] lg:w-[44%]"
        initial={{ opacity: 0, y: reduced ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0.2 : 0.6, delay: reduced ? 0 : 0.75, ease: EASE }}
      />
    </motion.figure>
  );
}
