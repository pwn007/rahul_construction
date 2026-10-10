'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * The page transition.
 *
 * `template.tsx`, not `layout.tsx`: Next remounts a template on every
 * navigation, which is exactly the hook an enter animation needs — a layout
 * persists and would never replay.
 *
 * Same easing, duration and reduced-motion branch as the Vite build's
 * AnimatePresence. The exit half is gone: the App Router unmounts the outgoing
 * route before the incoming one renders, so there is nothing left to animate
 * out. That also retires the Suspense-above-AnimatePresence ordering trap the
 * old PublicLayout had to document at length — Next owns the loading boundary
 * now, so a not-yet-loaded chunk can no longer strand a page at its exit values.
 */
export default function PublicTemplate({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.15 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
