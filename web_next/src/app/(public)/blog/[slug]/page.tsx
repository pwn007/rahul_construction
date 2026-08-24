import type { Metadata } from 'next';
import { PostDetailView } from '@/features/blog/PostDetailView';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { posts } from '@/data/content';
import { SITE } from '@/constants/site';
import { ROUTES } from '@/constants/routes';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return buildMetadata(
    { title: post.title, description: post.excerpt, image: post.coverImage, type: 'article' },
    ROUTES.post(slug),
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  return (
    <>
      {post && (
        <JsonLd
          data={{
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
      )}
      <PostDetailView slug={slug} />
    </>
  );
}
