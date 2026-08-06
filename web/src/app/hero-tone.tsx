import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Hero tone channel.
 *
 * The navbar is transparent at scroll-top, so it inherits whatever sits behind it.
 * Interior pages use a light hero; the homepage and project detail pages keep a
 * cinematic dark one. Without this channel the navbar renders navy-on-near-black
 * and the wordmark and links vanish.
 *
 * A page declares its hero tone with `useRegisterHeroTone('dark')`; the navbar
 * reads it and flips to a light-on-dark treatment. Registration resets to 'light'
 * on unmount, so a route change can never leave a stale tone behind.
 */

type HeroTone = 'light' | 'dark';

interface HeroToneValue {
  tone: HeroTone;
  setTone: (tone: HeroTone) => void;
}

const HeroToneContext = createContext<HeroToneValue>({ tone: 'light', setTone: () => {} });

export function HeroToneProvider({ children }: { children: ReactNode }) {
  const [tone, setTone] = useState<HeroTone>('light');
  const value = useMemo(() => ({ tone, setTone }), [tone]);
  return <HeroToneContext.Provider value={value}>{children}</HeroToneContext.Provider>;
}

/** Read the current hero tone (used by the navbar). */
export function useHeroTone(): HeroTone {
  return useContext(HeroToneContext).tone;
}

/** Declare the tone of this page's hero. */
export function useRegisterHeroTone(tone: HeroTone) {
  const { setTone } = useContext(HeroToneContext);

  const reset = useCallback(() => setTone('light'), [setTone]);

  useEffect(() => {
    setTone(tone);
    return reset;
  }, [tone, setTone, reset]);
}
