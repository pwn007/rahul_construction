import { useCallback, useMemo, useState } from 'react';
import { SYSTEMS, SYSTEM_ORDER, type SystemKey } from '@/data/mepf';

export type OffMap = Record<SystemKey, boolean>;

const ALL_ON: OffMap = { hvac: false, plumbing: false, electrical: false, fire: false };

/**
 * Which system is being looked at, and which have been switched off.
 *
 * Two pieces of state and nothing else. An earlier version of this hook also ran
 * an `IntersectionObserver` over five scrolling chapters to decide what the
 * drawing should show; the chapters are gone, and with them the only reason the
 * scene ever needed to know where the page had been scrolled to.
 */
export function useMepfScene() {
  const [focus, setFocus] = useState<SystemKey | null>(null);
  const [off, setOff] = useState<OffMap>(ALL_ON);

  const toggle = useCallback((key: SystemKey) => {
    setOff((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const restore = useCallback(() => setOff(ALL_ON), []);

  const anyOff = SYSTEM_ORDER.some((k) => off[k]);

  /**
   * What a screen reader is told, and only when it changes.
   *
   * Switching a system off is the announcement; hovering a row is not. The
   * project atlas learned that one the hard way — a live region that fires on
   * hover makes a section unusable with a screen reader running.
   */
  const message = useMemo(() => {
    const downed = SYSTEM_ORDER.filter((k) => off[k]);
    if (!downed.length) return 'All four systems are designed and running.';
    return downed.map((k) => `${SYSTEMS[k].name} switched off. ${SYSTEMS[k].without}`).join(' ');
  }, [off]);

  return { focus, setFocus, off, toggle, restore, anyOff, message };
}
