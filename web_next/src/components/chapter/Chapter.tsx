import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Fragment, type CSSProperties, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A chapter: the finalized design's building block.
 *
 * One screen of photograph (or the navy blueprint ground), a scrim, an optional
 * chapter number in the top-left, and the copy resting at the bottom. It is at
 * least one screen tall and grows with its content — a chapter is never clipped
 * to `100vh`, because admin-edited headings and quotes can run longer than the
 * design's copy. The styles live in globals.css under "CHAPTERS".
 *
 * Nothing here animates. Every chapter carries `data-section`, which is how the
 * section engine (lib/section-nav) finds the stops; `navigable={false}` opts
 * one out. Bands that are not chapters (the trust strip, the projects rail, …)
 * carry `data-section` on their own root for the same reason.
 *
 * A chapter that introduces parts of its own (MEPF) goes in a `ChapterStack`
 * with them: there each chapter holds still while the next one slides up over
 * it, and all of them carry the same plate, with a tick per part beside its
 * label. See ChapterStack.tsx.
 *
 *   <Chapter id="about" plate={{ num: '01', label: 'About' }}
 *            media={<ResponsiveImage src={…} alt="" />} aria-labelledby="about-h">
 *     <ChapterEyebrow>About Neetu Archstone</ChapterEyebrow>
 *     <ChapterTitle id="about-h" lines={['One system.', { text: 'One point of responsibility.', em: true }]} />
 *     <ChapterLede>…</ChapterLede>
 *   </Chapter>
 */
export interface ChapterProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  as?: 'section' | 'footer' | 'div';
  /** The background, usually a `ResponsiveImage`. Decorative photos take `alt=""`. */
  media?: ReactNode;
  /** The faint blueprint grid on the navy ground, for chapters without a photo. */
  grid?: boolean;
  /** `dense` for long text over a bright photograph; `none` when the photo needs no help. */
  scrim?: 'default' | 'dense' | 'none';
  align?: 'left' | 'right' | 'center';
  /** The label in the top-left, under the chapter's number if it is given one ("01 · About"). */
  plate?: ChapterPlateProps;
  /** A stop for the section engine. On by default. */
  navigable?: boolean;
  innerClassName?: string;
  children: ReactNode;
}

export function Chapter({
  as: Tag = 'section',
  media,
  grid = false,
  scrim = 'default',
  align = 'left',
  plate,
  navigable = true,
  className,
  innerClassName,
  children,
  ...rest
}: ChapterProps) {
  return (
    <Tag
      {...rest}
      className={cn('chapter on-dark', className)}
      data-align={align}
      /* Every photograph is graded the same way (globals.css, "Chapter grade"):
         natural, with shade only where words sit. The plate at the top gets its
         own patch of it. */
      data-plate-band={plate ? '' : undefined}
      data-section={navigable ? '' : undefined}
    >
      {media && <div className="chapter__media">{media}</div>}
      {grid && <div className="chapter__grid" aria-hidden />}
      {scrim !== 'none' && (
        <div className="chapter__scrim" data-scrim={scrim === 'dense' ? 'dense' : undefined} aria-hidden />
      )}
      {plate && <ChapterPlate {...plate} />}
      <div className="chapter__copy">
        <div className="chapter-gutters">
          <div className={cn('chapter__inner', innerClassName)}>{children}</div>
        </div>
      </div>
    </Tag>
  );
}

export interface ChapterPlateProps {
  /** The chapter's number over the label ("01"). Left out, the label stands alone. */
  num?: string;
  label: string;
  /** In a stack: how many parts the chapter introduces — one tick each, beside the label. */
  parts?: number;
  /** In a stack: which part this chapter is, from 1. The ticks up to it are lit; the entry lights none. */
  part?: number;
}

/* The number repeats what the heading already says, so it is hidden from
   assistive technology; the heading carries the section's name. The ticks sit
   on the label's own line: under it they would need room that a short phone's
   chapter does not have. */
export function ChapterPlate({ num, label, parts = 0, part = 0 }: ChapterPlateProps) {
  return (
    <div className="chapter-plate" aria-hidden>
      <div className="chapter-gutters">
        {num ? <span className="chapter-plate__num">{num}</span> : null}
        <span className="chapter-plate__label">
          {label}
          {parts > 0 ? (
            <span className="chapter-plate__parts">
              {Array.from({ length: parts }, (_, i) => (
                <span key={i} data-on={i < part || undefined} />
              ))}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function ChapterEyebrow({
  children,
  plain = false,
  className,
}: {
  children: ReactNode;
  /** Without the hairline underneath. */
  plain?: boolean;
  className?: string;
}) {
  return (
    <p className={cn('chapter-eyebrow', className)} data-plain={plain || undefined}>
      {children}
    </p>
  );
}

export type ChapterLine = string | { text: ReactNode; em?: boolean };

/**
 * A heading's lines when the admin may have replaced its words.
 *
 * Admin headings are one plain string ("Hand us one part, or the whole
 * build."), and the baked admin rows already hold the design's own words — so
 * a string that matches the designed heading gets the designed lines, second
 * voice and all. Any other string breaks once, after its first comma or full
 * stop, with the rest as the second voice; a heading with neither stays on one
 * line.
 */
export function chapterLines(admin: string | undefined | null, designed: ChapterLine[]): ChapterLine[] {
  const text = admin?.trim();
  if (!text) return designed;
  const plain = (lines: ChapterLine[]) =>
    lines.map((l) => (typeof l === 'string' ? l : String(l.text))).join(' ');
  const squash = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();
  if (squash(text) === squash(plain(designed))) return designed;
  const m = text.match(/^(.+?[,.])\s+(.+)$/);
  return m ? [m[1], { text: m[2], em: true }] : [text];
}

/**
 * The heading, one span per line.
 *
 * Lines are separate elements so they can move independently when the reveals
 * arrive, and a space is kept between them so the heading's text still reads
 * "Built across Jaipur" to search engines and screen readers — not
 * "Built acrossJaipur", which is what bare adjacent spans produce.
 */
export function ChapterTitle({
  as: Tag = 'h2',
  lines,
  children,
  href,
  size = 'md',
  id,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3';
  lines?: ChapterLine[];
  /** Instead of `lines`, for a heading with markup of its own. */
  children?: ReactNode;
  /** The heading is itself the link (a service's name opens its page). Internal paths only. */
  href?: string;
  size?: 'hero' | 'md' | 'sm';
  id?: string;
  className?: string;
}) {
  const body = lines
    ? lines.map((line, i) => {
        const { text, em } = typeof line === 'string' ? { text: line, em: false } : line;
        return (
          <Fragment key={i}>
            <span className="ln">{em ? <em>{text}</em> : text}</span>
            {i < lines.length - 1 ? ' ' : null}
          </Fragment>
        );
      })
    : children;
  return (
    <Tag id={id} className={cn('chapter-title', className)} data-size={size === 'md' ? undefined : size}>
      {href ? (
        <Link href={href} className="chapter-title__link">
          {body}
        </Link>
      ) : (
        body
      )}
    </Tag>
  );
}

export function ChapterLede({ children, className, lang }: { children: ReactNode; className?: string; lang?: string }) {
  return (
    <p className={cn('chapter-lede', className)} lang={lang}>
      {children}
    </p>
  );
}

export function ChapterTags({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn('chapter-tags', className)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export interface ChapterFigure {
  label: string;
  value: ReactNode;
  /** A word rather than a number ("Completed", "G+3 with basement"): set smaller. */
  long?: boolean;
}

/** Key figures under a chapter's copy: value above, label below, as a definition list. */
export function ChapterFigures({ items, className }: { items: ChapterFigure[]; className?: string }) {
  if (!items.length) return null;
  return (
    <dl
      className={cn('chapter-figures', className)}
      data-count={items.length}
      style={{ '--figure-count': items.length } as CSSProperties}
    >
      {items.map((figure) => (
        <div className="chapter-figure" key={figure.label}>
          <dt>{figure.label}</dt>
          <dd data-long={figure.long || undefined}>{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The chapter's numeral above its heading ("01" over "Air"), for a run of
 * chapters that are steps of one list. Hidden from assistive technology for
 * the same reason as the plate: the heading already names the step.
 */
export function ChapterIndex({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('chapter-idx', className)} aria-hidden>
      {children}
    </span>
  );
}

/**
 * One line set apart under a cyan hairline, in the display face — what goes
 * wrong without the thing the chapter describes. Brand cyan for the rule and
 * white for the words: the design's coral was a third hue (decision 7).
 */
export function ChapterAside({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('chapter-aside', className)}>{children}</p>;
}

/** The row the chapter's links sit in; it follows the chapter's alignment. */
export function ChapterLinks({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('chapter-links', className)}>{children}</div>;
}

/**
 * A quiet link: a small-caps label and an arrow in a ring that fills on hover.
 * The design's secondary action ("Look inside the house", "All projects");
 * `PillLink` is the louder one, for calls and WhatsApp.
 *
 * Internal paths go through `next/link` so they prefetch and route on the
 * client; `external` opens a new tab.
 */
export function ChapterLink({
  href,
  children,
  ariaLabel,
  external = false,
  onClick,
  className,
}: {
  href: string;
  /** Leave out for the arrow alone — then `ariaLabel` is required in practice. */
  children?: ReactNode;
  ariaLabel?: string;
  external?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}) {
  const body = (
    <>
      {children ? <span>{children}</span> : null}
      <span className="chapter-link__arrow" aria-hidden>
        <ArrowUpRight strokeWidth={2} />
      </span>
    </>
  );
  const classes = cn('chapter-link', className);
  const shared = { className: classes, onClick, 'aria-label': ariaLabel, 'data-bare': children ? undefined : true };
  if (external || !href.startsWith('/')) {
    return (
      <a
        href={href}
        {...shared}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} {...shared}>
      {body}
    </Link>
  );
}

export interface ChapterCard {
  /** Usually an in-page anchor to the chapter the card stands for ("#mepf-hvac"). */
  href: string;
  /** A step number ("01"); decorative, the title names the card. */
  num?: string;
  title: ReactNode;
  /** One short line under the title. */
  text?: ReactNode;
  /** A line icon, top right. Decorative. */
  icon?: ReactNode;
}

/**
 * A row of small linked cards inside a chapter — an index of the parts the
 * chapter introduces, each card jumping to that part's own chapter (MEPF's
 * four systems). Four across from tablet width, two by two on phones.
 * Styles in globals.css under "Chapter cards".
 */
export function ChapterCards({ items, label, className }: { items: ChapterCard[]; label?: string; className?: string }) {
  if (!items.length) return null;
  return (
    <ul
      className={cn('chapter-cards', className)}
      aria-label={label}
      style={{ '--card-count': items.length } as CSSProperties}
    >
      {items.map((card) => (
        <li key={card.href}>
          <a href={card.href} className="chapter-card">
            {card.num ? (
              <span className="chapter-card__num" aria-hidden>
                {card.num}
              </span>
            ) : null}
            {card.icon ? (
              <span className="chapter-card__icon" aria-hidden>
                {card.icon}
              </span>
            ) : null}
            <span className="chapter-card__title">{card.title}</span>
            {card.text ? <span className="chapter-card__text">{card.text}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
