import ServiceShell from '@/components/services/ServiceShell';
import QuoteForm from '@/components/services/QuoteForm';
import { Breadcrumbs } from '@/components/services/ServicePage';
import { findService, siteUrl } from '@/content/services.mjs';
import '../../services.css';

export const metadata = { title: 'Request a Free Quote | Optitech', description: 'Tell Optitech about your digital project and request a quotation tailored to your business.', alternates: { canonical: `${siteUrl}/contact/quote` }, robots: { index: false, follow: true } };
export default async function QuotePage({ searchParams }) {
  const query = await searchParams;
  const service = typeof query.service === 'string' ? findService(query.service) : null;
  const item = typeof query.package === 'string' ? service?.packages.find(item => item.id === query.package) : null;
  const invalidContext = Boolean((query.service && !service) || (query.package && !item));
  return <ServiceShell><main id="main-content" className="service-main"><Breadcrumbs label="Get a Free Quote" /><section className="service-hero" data-service-reveal><p className="service-eyebrow">Contact / Your next project</p><h1>Let's Talk About Your Business.</h1><p className="service-index-description">Tell us what you need, and we'll recommend the right solution for your goals and budget.</p></section><QuoteForm initialService={service?.slug || ''} initialPackage={item?.id || ''} invalidContext={invalidContext} /></main></ServiceShell>;
}
