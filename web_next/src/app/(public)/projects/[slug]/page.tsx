import type { Metadata } from 'next';
import { ProjectDetailView } from '@/features/projects/ProjectDetailView';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { projects } from '@/data/projects';
import { ROUTES } from '@/constants/routes';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return buildMetadata(
    { title: project.title, description: project.excerpt, image: project.coverImage, type: 'article' },
    ROUTES.project(slug),
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  return (
    <>
      {project && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.title,
            description: project.excerpt,
            image: project.coverImage,
            dateCreated: String(project.year),
            locationCreated: { '@type': 'Place', name: `${project.locality}, ${project.city}` },
          }}
        />
      )}
      <ProjectDetailView slug={slug} />
    </>
  );
}
