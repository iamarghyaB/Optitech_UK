import { services } from '@/content/services.mjs';
import SiteNavigation from './SiteNavigation';
import ServiceMotion from './ServiceMotion';

export default function ServiceShell({ children }) {
  return <div className="optitech-services">
    <a className="service-skip" href="#main-content">Skip to content</a>
    <SiteNavigation />
    {children}
    <footer className="service-footer">
      <a className="service-footer-wordmark" href="/">Optitech</a>
      <nav aria-label="Footer services">{services.map(service => <a key={service.slug} href={`/services/${service.slug}`}>{service.title}</a>)}</nav>
      <div className="service-footer-bottom"><span>Digital solutions for UK businesses.</span><nav aria-label="Footer"><a href="/services">Services</a><a href="/work">Demo Work</a><a href="/contact/quote">Contact</a><a href="/privacy-policy">Privacy Policy</a><a href="/cookie-policy">Cookie Policy</a></nav></div>
    </footer>
    <ServiceMotion />
  </div>;
}
