import { services, quoteHref, finalCta } from '@/content/services.mjs';

export function Arrow() {
  return <span className="service-arrow" aria-hidden="true"><svg viewBox="0 0 18 14" fill="none"><path d="M11 13L17 7L11 1M16 7H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}
export function QuoteLink({ service, packageId, children = 'Get a Free Quote', className = '' }) {
  return <a className={`service-button ${className}`} href={quoteHref(service, packageId)}>{children}<Arrow /></a>;
}
export function Breadcrumbs({ service, label }) {
  return <nav aria-label="Breadcrumb" className="service-breadcrumb"><ol><li><a href="/">Home</a></li><li>{service || label ? <a href="/services">Services</a> : <span aria-current="page">Services</span>}</li>{service && <li><span aria-current="page">{service.title}</span></li>}{label && <li><span aria-current="page">{label}</span></li>}</ol></nav>;
}
function Section({ id, number, title, children }) {
  return <section id={id} className="service-section" aria-labelledby={`${id}-heading`}>
    <div className="service-section-label"><span>({number})</span><h2 id={`${id}-heading`}>{title}</h2></div><div className="service-section-content" data-service-reveal>{children}</div>
  </section>;
}
export function PricingCard({ service, item }) {
  return <article className="service-price-card">
    <div className="service-price-card-top"><p className="service-eyebrow">{service.category}</p><h3>{item.name}</h3><p className="service-price">{item.price}</p><p className="service-timeline"><span>Estimated delivery / schedule</span>{item.timeline}</p><p>{item.description}</p></div>
    <ul className="service-features">{item.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
    <p className="service-ideal"><span>Ideal for</span>{item.ideal}</p>
    <QuoteLink service={service} packageId={item.id}>Get a Quote<span className="service-sr-only"> for {item.name}</span></QuoteLink>
  </article>;
}
export function ComparisonTable({ comparison }) {
  return <div className="service-table-scroll" role="region" tabIndex="0" aria-label={comparison.caption}><table className="service-comparison"><caption>{comparison.caption}</caption><thead><tr>{comparison.headings.map(heading => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{comparison.rows.map(row => <tr key={row[0]}>{row.map((value, index) => index === 0 ? <th key={index} scope="row">{value}</th> : <td key={index}>{value}</td>)}</tr>)}</tbody></table></div>;
}
export function FinalCTA({ service }) {
  return <section className="service-final-cta" data-service-reveal><p className="service-eyebrow">Your next step</p><h2>{finalCta.headline}</h2><p>{finalCta.description}</p><QuoteLink service={service}>{finalCta.button}</QuoteLink></section>;
}
export default function ServicePage({ service }) {
  return <main id="main-content" className="service-main">
    <Breadcrumbs service={service} />
    <section className="service-hero" data-service-reveal><p className="service-eyebrow">{service.title}</p><h1>{service.headline}</h1><div className="service-hero-bottom"><p>{service.description}</p><div><p className="service-starting-price">{service.startingPrice}</p><p className="service-small">Indicative pricing · subject to agreed scope</p><div className="service-actions"><QuoteLink service={service} /><a className="service-text-link" href="#packages">Explore Packages ↓</a></div></div></div></section>
    <Section id="offerings" number="01" title="What We Offer"><div className="service-offerings">{service.offers.map((offer, index) => <div key={offer}><span className="service-eyebrow">{String(index + 1).padStart(2, '0')}</span><h3>{offer}</h3><Arrow /></div>)}</div></Section>
    <Section id="packages" number="02" title="Pricing & Delivery"><p className="service-intro">Indicative starting prices and ranges in GBP. Your final quotation and delivery schedule depend on the agreed scope.</p><div className="service-price-grid">{service.packages.map(item => <PricingCard key={item.id} item={item} service={service} />)}</div><p className="service-scope-note">{service.note}</p>{service.extraNote && <p className="service-scope-note">{service.extraNote} <a href="/services/custom-software">Explore custom software <Arrow /></a></p>}{service.comparison && <ComparisonTable comparison={service.comparison} />}</Section>
    <Section id="included" number="03" title="What's Included"><p className="service-intro">Deliverables are tailored to your chosen package. We confirm the exact scope before work starts.</p><ul className="service-included-list">{service.included.map(item => <li key={item}>{item}<span aria-hidden="true">↗</span></li>)}</ul></Section>
    <Section id="process" number="04" title="Our Process"><ol className="service-process">{service.process.map((step, index) => <li key={step}><span className="service-eyebrow">{String(index + 1).padStart(2, '0')}</span><h3>{step}</h3></li>)}</ol></Section>
    <Section id="questions" number="05" title="Frequently Asked Questions"><div className="service-faqs">{service.faqs.map(item => <details key={item.question}><summary><h3>{item.question}</h3><span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></Section>
    <FinalCTA service={service} />
    <nav className="service-related" aria-label="Explore other services"><p className="service-eyebrow">Explore our other services</p><div>{services.filter(item => item.slug !== service.slug).map(item => <a key={item.slug} href={`/services/${item.slug}`}>{item.title}<Arrow /></a>)}</div></nav>
  </main>;
}
