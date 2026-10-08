import { notFound } from 'next/navigation';
import ServicePage from '@/components/services/ServicePage';
import { services, findService, siteUrl } from '@/content/services.mjs';

// Unknown slugs reach notFound() normally instead of the archived catch-all.
export const dynamicParams = true;
export function generateStaticParams() { return services.map(service => ({ slug: service.slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return {};
  const url = `${siteUrl}/services/${slug}`;
  return { title: service.seoTitle, description: service.description, alternates: { canonical: url }, robots: { index: true, follow: true }, openGraph: { title: service.seoTitle, description: service.description, url, siteName: 'Optitech', locale: 'en_GB', type: 'website' } };
}
export default async function Page({ params }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();
  return <ServicePage service={service} />;
}
