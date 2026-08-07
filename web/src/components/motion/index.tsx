import {
  Children,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import {
  motion,
  useInView as useFramerInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion, useHasFinePointer, useInView } from '@/hooks';
import { formatNumber } from '@/lib/format';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ==================================================================== */
/* Reveal — the canonical entrance                                       */
/* ==================================================================== */

/**
 * Note on `as`: we deliberately switch between two *static* motion components
 * rather than calling `motion(Tag)` in render. `motion()` returns a new component
 * type on every call, which React treats as a different element — remounting the
 * whole subtree on each render and killing both state and animation continuity.
 */
export function Reveal({
  children,
  delay = 0,
  duration = 0.8,
  y = 24,
  x = 0,
  once = true,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  once?: boolean;
  className?: string;
  as?: 'div' | 'span' | 'li';
}) {
  const reduced = usePrefersReducedMotion();

  const props = {
    className,
    initial: reduced ? { opacity: 0 } : { opacity: 0, y, x },
    whileInView: reduced ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 },
    viewport: { once, margin: '0px 0px -10% 0px' },
    transition: { duration: reduced ? 0.2 : duration, delay, ease: EASE },
  } as const;

  if (as === 'span') return <motion.span {...props}>{children}</motion.span>;
  if (as === 'li') return <motion.li {...props}>{children}</motion.li>;
  return <motion.div {...props}>{children}</motion.div>;
}

/* ==================================================================== */
/* StaggerGroup — reveals children in sequence                           */
/* ==================================================================== */

export function StaggerGroup({
  children,
  stagger = 0.06,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '0px 0px -10% 0px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
      }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: reduced ? { opacity: 0 } : { opacity: 0, y },
            show: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
          }}
          transition={{ duration: reduced ? 0.2 : 0.75, ease: EASE }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ==================================================================== */
/* SplitText — kinetic per-word headline reveal                          */
/* ==================================================================== */

export function SplitText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.045,
  once = true,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const words = useMemo(() => text.split(' '), [text]);

  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden py-[0.06em] align-bottom" aria-hidden>
          <motion.span
            className={cn('inline-block', wordClassName)}
            variants={{
              hidden: { y: '110%', opacity: 0 },
              show: { y: '0%', opacity: 1 },
            }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {word}
            {i < words.length - 1 && ' '}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* ==================================================================== */
/* MaskImage — clip-path reveal for photography                          */
/* ==================================================================== */

export function MaskImage({
  src,
  alt,
  className,
  imgClassName,
  ratio = 'aspect-[4/3]',
  delay = 0,
  parallax = false,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  ratio?: string;
  delay?: number;
  parallax?: boolean;
  priority?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], parallax && !reduced ? ['-8%', '8%'] : ['0%', '0%']);

  return (
    <motion.div
      ref={ref}
      className={cn('relative overflow-hidden', ratio, className)}
      initial={reduced ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={reduced ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: reduced ? 0.2 : 1.1, delay, ease: EASE }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{ y }}
        className={cn('h-full w-full scale-[1.12] object-cover', imgClassName)}
      />
    </motion.div>
  );
}

/* ==================================================================== */
/* Parallax                                                              */
/* ==================================================================== */

export function Parallax({
  children,
  speed = 0.15,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const raw = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: reduced ? 0 : y }}>{children}</motion.div>
    </div>
  );
}

/* ==================================================================== */
/* Counter — animated statistic                                          */
/* ==================================================================== */

export function Counter({
  value,
  suffix = '',
  prefix = '',
  duration = 1800,
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * t);
      setDisplay(value * (t === 1 ? 1 : eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={cn('num tabular-nums', className)}>
      {prefix}
      {formatNumber(display, decimals)}
      {suffix}
    </span>
  );
}

/* ==================================================================== */
/* Marquee                                                               */
/* ==================================================================== */

export function Marquee({
  children,
  speed = 40,
  className,
  pauseOnHover = true,
  reverse = false,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
}) {
  return (
    <div className={cn('group relative flex overflow-hidden mask-fade-x', className)}>
      <div
        className={cn(
          'flex min-w-full shrink-0 items-center gap-12 animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        <span className="flex items-center gap-12" aria-hidden>
          {children}
        </span>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Magnetic — cursor-proximity attraction                                */
/* ==================================================================== */

export function Magnetic({
  children,
  strength = 0.32,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.35 });

  if (reduced || !fine) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ==================================================================== */
/* ScrollProgress — thin top bar                                         */
/* ==================================================================== */

/**
 * The progress bar carries a spirit level at its leading edge: a short glass
 * vial with a bubble that lags behind the direction of travel, overshoots when
 * you stop, and settles back to centre.
 *
 * The physics are the point — a bubble that simply tracked the scroll position
 * would be decoration, whereas one that is visibly wrong while you are moving
 * and only true once you have stopped is the instrument behaving like itself.
 * It comes free: `useVelocity` on the scroll progress into a deliberately
 * under-damped spring is exactly the second-order response of the real thing.
 *
 * Everything stays inside the bar's existing 2px, so nothing is clipped at the
 * top of the viewport and the chrome is no taller than before.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  const left = useTransform(scaleX, (v) => `${v * 100}%`);

  const velocity = useVelocity(scrollYProgress);
  // Under-damped on purpose: damping this low is what produces the overshoot.
  const drift = useSpring(useTransform(velocity, [-2, 0, 2], [13, 0, -13], { clamp: true }), {
    stiffness: 90,
    damping: 11,
    mass: 0.6,
  });

  return (
    <>
      <motion.div
        style={{ scaleX }}
        className={cn('fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-cyan-500', className)}
        aria-hidden
      />
      {!reduced && (
        <motion.div
          style={{ left }}
          className="pointer-events-none fixed top-0 z-[61] h-[2px] w-11 -translate-x-full overflow-hidden rounded-full bg-navy-900/30"
          aria-hidden
        >
          <motion.span style={{ x: drift }} className="absolute left-4 top-0 h-[2px] w-3 rounded-full bg-white/80" />
        </motion.div>
      )}
    </>
  );
}

/* ==================================================================== */
/* TiltCard — subtle 3D response                                         */
/* ==================================================================== */

export function TiltCard({
  children,
  className,
  max = 6,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 24 });
  const sry = useSpring(ry, { stiffness: 200, damping: 24 });

  if (reduced || !fine) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn('perspective', className)}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', ...style }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        ry.set(px * max * 2);
        rx.set(-py * max * 2);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ==================================================================== */
/* InViewFlag — for imperative animations                                */
/* ==================================================================== */

export function useSectionInView<T extends HTMLElement>(amount: number = 0.3) {
  const ref = useRef<T>(null);
  const inView = useFramerInView(ref, { once: true, amount: amount as never });
  return { ref, inView };
}
