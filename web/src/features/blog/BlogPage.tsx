import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Search } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { CtaBand, PageHero } from '@/components/common';
import { Badge, EmptyState, Input, Tabs } from '@/components/ui';
import { MaskImage, Reveal } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { posts } from '@/data/content';
import { formatDate } from '@/lib/format';
import { useDebouncedValue } from '@/hooks';
import { HIGH_PRIORITY_IMG } from '@/lib/dom';

export default function BlogPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 250);

  const categories = useMemo(() => ['all', ...new Set(posts.map((p) => p.category))], []);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesCategory = category === 'all' || p.category === category;
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [category, debounced]);

  const featured = posts.find((p) => p.featured);

  return (
    <>
      <Seo
        title="Insights — Guides on Building in Jaipur"
        description="Practical writing on construction costs, timelines, Vastu, MEPF and the decisions that actually change the outcome of your build."
      />

      <PageHero
        overline="Insights"
        title="What we have learned building here"
        lead="Practical writing on costs, timelines and the decisions that actually change the outcome. No filler, no keyword padding."
        breadcrumbs={[{ label: 'Insights' }]}
        stats={[
          { value: posts.length, label: 'Articles published' },
          { value: categories.length - 1, label: 'Topics covered' },
          { value: Math.round(posts.reduce((s, p) => s + p.readingMinutes, 0)), label: 'Minutes of reading' },
        ]}
        aside={
          featured ? (
            <Link to={ROUTES.post(featured.slug)} className="group block">
              <div className="surface overflow-hidden rounded-2xl border shadow-lg">
                <img
                  src={featured.coverImage}
                  alt=""
                  aria-hidden
                  {...HIGH_PRIORITY_IMG}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-[1.1s] ease-out-expo group-hover:scale-[1.04]"
                />
                <div className="p-6">
                  <Badge variant="brand" size="sm">Featured</Badge>
                  <h2 className="mt-3 font-display text-heading-lg font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                    {featured.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-caption leading-relaxed text-muted">{featured.excerpt}</p>
                  <p className="num mt-4 text-caption text-subtle">
                    {featured.author} · {featured.readingMinutes} min read
                  </p>
                </div>
              </div>
            </Link>
          ) : undefined
        }
      />

      {/* Featured */}
      {featured && (
        <section className="section-sm pb-0">
          <div className="container">
            <Link to={ROUTES.post(featured.slug)} className="group grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <MaskImage
                  src={featured.coverImage}
                  alt={featured.title}
                  ratio="aspect-[16/10]"
                  className="rounded-xl"
                  imgClassName="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
                  priority
                />
              </div>
              <div className="lg:col-span-5">
                <Reveal>
                  <Badge variant="brand" size="md">
                    Featured
                  </Badge>
                  <div className="mt-4 flex items-center gap-3 text-caption text-subtle">
                    <span>{featured.category}</span>
                    <span>·</span>
                    <span>{formatDate(featured.publishedAt)}</span>
                    <span>·</span>
                    <span className="num">{featured.readingMinutes} min read</span>
                  </div>
                  <h2 className="mt-3 text-display-sm transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                    {featured.title}
                  </h2>
                  <p className="mt-4 leading-relaxed text-muted">{featured.excerpt}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <img src={featured.authorAvatar} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />
                    <div>
                      <p className="text-sm font-medium">{featured.author}</p>
                      <p className="text-caption text-subtle">{featured.authorRole}</p>
                    </div>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
                    Read article <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Reveal>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Filters + grid */}
      <section className="section-sm">
        <div className="container">
          <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
            <Tabs
              tabs={categories.map((c) => ({
                value: c,
                label: c === 'all' ? 'All topics' : c,
                count: c === 'all' ? posts.length : posts.filter((p) => p.category === c).length,
              }))}
              value={category}
              onChange={setCategory}
              variant="pill"
              className="inline-flex"
            />
            <div className="md:w-72">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search insights…"
                aria-label="Search insights"
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No articles found"
              description={`Nothing matches “${search}”. Try a different term.`}
              className="mt-6"
            />
          ) : (
            <motion.div layout className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((post, i) => (
                  <motion.article
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link to={ROUTES.post(post.slug)} className="group block">
                      <div className="overflow-hidden rounded-lg">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          loading="lazy"
                          className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-5 flex items-center gap-3 text-caption text-subtle">
                        <Badge variant="brand" size="sm">
                          {post.category}
                        </Badge>
                        <span>{formatDate(post.publishedAt)}</span>
                        <span className="num">{post.readingMinutes} min</span>
                      </div>
                      <h3 className="mt-3 font-display text-heading-lg font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                      <p className="mt-4 text-caption text-subtle">By {post.author}</p>
                    </Link>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      <CtaBand
        title="Have a question we have not written about?"
        lead="Ask us directly — the answer usually becomes the next article."
        primary={{ label: 'Ask a question', href: ROUTES.contact }}
        secondary={{ label: 'Get an estimate', href: ROUTES.estimator }}
      />
    </>
  );
}
