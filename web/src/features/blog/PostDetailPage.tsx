import { Fragment, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, Check, Link2, Share2 } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { CtaBand } from '@/components/common';
import { Badge, Button, useToast } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { posts } from '@/data/content';
import { formatDate } from '@/lib/format';
import { SITE } from '@/constants/site';
import { useCopy } from '@/hooks';
import { HIGH_PRIORITY_IMG } from '@/lib/dom';

/**
 * Minimal markdown renderer for the mock article bodies.
 * Phase 2 replaces this with a proper MDX/rich-text pipeline from the CMS —
 * the component contract (`body: string`) stays identical.
 */
function ArticleBody({ body }: { body: string }) {
  const blocks = useMemo(() => body.split('\n\n'), [body]);

  return (
    <div className="max-w-prose">
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="mt-12 font-display text-heading-lg font-semibold first:mt-0">
              {trimmed.slice(3)}
            </h2>
          );
        }

        if (trimmed.startsWith('| ')) {
          const rows = trimmed.split('\n').filter((r) => !/^\|\s*-+/.test(r.replace(/\s/g, '')));
          return (
            <div key={i} className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {rows.map((row, ri) => {
                    const cells = row.split('|').filter((c) => c.trim() !== '');
                    return (
                      <tr key={ri} className="border-b last:border-0">
                        {cells.map((cell, ci) => (
                          <td key={ci} className={ri === 0 ? 'py-3 pr-4 font-medium' : 'py-3 pr-4 text-muted'}>
                            {cell.trim().replace(/\*\*/g, '')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        if (trimmed.startsWith('- ')) {
          return (
            <ul key={i} className="mt-5 space-y-2.5">
              {trimmed.split('\n').map((line, li) => (
                <li key={li} className="flex items-start gap-3 leading-relaxed text-muted">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500" aria-hidden />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: line
                        .slice(2)
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[rgb(var(--c-text))] font-semibold">$1</strong>'),
                    }}
                  />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={i}
            className="mt-5 leading-[1.75] text-muted first:mt-0"
            dangerouslySetInnerHTML={{
              __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[rgb(var(--c-text))] font-semibold">$1</strong>'),
            }}
          />
        );
      })}
    </div>
  );
}

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40 });
  const { copied, copy } = useCopy();
  const { push } = useToast();

  const post = posts.find((p) => p.slug === slug);
  if (!post) return <Navigate to={ROUTES.blog} replace />;

  const related = posts.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3);
  const shareUrl = `${SITE.url}${ROUTES.post(post.slug)}`;

  const headings = post.body
    .split('\n\n')
    .filter((b) => b.trim().startsWith('## '))
    .map((b) => b.trim().slice(3));

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage,
          datePublished: post.publishedAt,
          author: { '@type': 'Person', name: post.author, jobTitle: post.authorRole },
          publisher: { '@type': 'Organization', name: SITE.name },
        }}
      />

      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-cyan-500" aria-hidden />

      {/* Header */}
      <article>
        <header className="pt-32 md:pt-40">
          <div className="container max-w-4xl">
            <Link to={ROUTES.blog} className="inline-flex items-center gap-2 text-caption text-subtle transition-colors hover:text-cyan-700">
              <ArrowLeft className="h-3.5 w-3.5" /> All insights
            </Link>

            <Reveal className="mt-6">
              <Badge variant="brand" size="md">
                {post.category}
              </Badge>
              <h1 className="mt-4 text-display-md">{post.title}</h1>
              <p className="mt-5 text-body-lg leading-relaxed text-muted">{post.excerpt}</p>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y py-5">
                <div className="flex items-center gap-3">
                  <img src={post.authorAvatar} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="text-sm font-medium">{post.author}</p>
                    <p className="text-caption text-subtle">{post.authorRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-caption text-subtle">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span className="num">{post.readingMinutes} min read</span>
                  <button
                    onClick={() => {
                      void copy(shareUrl);
                      push({ kind: 'success', title: 'Link copied' });
                    }}
                    className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors hover:border-cyan-500 hover:text-cyan-700"
                    aria-label="Copy link to this article"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Share'}
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </header>

        <div className="container mt-10 max-w-5xl">
          <Reveal>
            <img src={post.coverImage} alt={post.title} className="aspect-[16/9] w-full rounded-xl object-cover" {...HIGH_PRIORITY_IMG} />
          </Reveal>
        </div>

        {/* Body + TOC */}
        <div className="container mt-14 pb-20">
          <div className="grid gap-12 lg:grid-cols-12">
            <aside className="hidden lg:col-span-3 lg:block">
              {headings.length > 0 && (
                <div className="sticky top-28">
                  <p className="text-overline uppercase text-subtle">In this article</p>
                  <ul className="mt-4 space-y-2.5 border-l pl-4">
                    {headings.map((h) => (
                      <li key={h}>
                        <span className="text-caption leading-relaxed text-muted">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            <div className="lg:col-span-9">
              <ArticleBody body={post.body} />

              <div className="mt-12 flex flex-wrap gap-2 border-t pt-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="md">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="section-sm border-t">
          <div className="container">
            <p className="overline">Keep reading</p>
            <h2 className="mt-3 text-display-sm">More on {post.category.toLowerCase()}</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} to={ROUTES.post(p.slug)} className="group block">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-heading-md font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                    {p.title}
                  </h3>
                  <p className="num mt-1 text-caption text-subtle">{p.readingMinutes} min read</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand title="Ready to put this into practice?" lead="Run your numbers through the estimator, then talk to us about the specifics." />
    </>
  );
}
