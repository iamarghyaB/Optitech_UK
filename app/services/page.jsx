import { services, siteUrl } from '@/content/services.mjs';
import { Breadcrumbs, Arrow } from '@/components/services/ServicePage';

export const metadata = { title: 'Digital Services for UK Businesses | Optitech', description: 'Explore Optitech’s web development, e-commerce, SEO, Google Business Profile, advertising, automation, software and website support services.', alternates: { canonical: `${siteUrl}/services` }, robots: { index: true, follow: true } };
export default function ServicesIndex() {
  return <main id="main-content" className="service-main"><Breadcrumbs /><section className="service-hero" data-service-reveal><p className="service-eyebrow">Services / What We Do</p><h1>Digital Solutions Built Around Your Business.</h1><p className="service-index-description">Explore the right support for your website, visibility and day-to-day operations. Clear scope, practical delivery and pricing in GBP.</p></section><div className="service-directory" data-service-reveal>{services.map(service => <a key={service.slug} href={`/services/${service.slug}`}><div><h2>{service.title}</h2><p>{service.category}</p></div><Arrow /></a>)}</div><div className="service-index-contact"><a className="service-button" href="/contact/quote">Discuss Your Requirements<Arrow /></a></div></main>;
}
