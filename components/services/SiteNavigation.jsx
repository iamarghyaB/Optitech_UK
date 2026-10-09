'use client';

import { useRef } from 'react';
import { services } from '@/content/services.mjs';

export default function SiteNavigation() {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const close = () => { dialog.current.close(); trigger.current.focus(); };
  return <header className="service-header">
    <a className="service-wordmark" href="/" aria-label="Optitech home"><img src="/assets/local/optitech-logo.svg" alt="Optitech" width="72" height="54" /><span aria-hidden="true" /></a>
    <button ref={trigger} className="service-menu-toggle" aria-label="Open navigation menu" aria-haspopup="dialog" onClick={() => dialog.current.showModal()}><span /><span /></button>
    <dialog ref={dialog} className="service-menu" aria-labelledby="navigation-title" onClick={event => { if (event.target === dialog.current) close(); }}>
      <div className="service-menu-content"><button className="service-menu-close" onClick={close} aria-label="Close navigation menu">×</button>
        <p id="navigation-title" className="service-eyebrow">Optitech / Navigation</p>
        <nav aria-label="Primary"><a href="/">Home</a><a href="/services">Services</a><a href="/work">Work</a><a href="/universe">Our Approach</a><a href="/contact/quote">Get a Free Quote</a></nav>
        <nav className="service-menu-services" aria-label="Our services">{services.map(service => <a key={service.slug} href={`/services/${service.slug}`}>{service.title}</a>)}</nav>
      </div>
    </dialog>
  </header>;
}
