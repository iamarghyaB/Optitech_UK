'use client';

import { useRef, useState } from 'react';
import { services, findService } from '@/content/services.mjs';
import { Arrow } from './ServicePage';

export default function QuoteForm({ initialService = '', initialPackage = '', invalidContext = false }) {
  const [serviceSlug, setServiceSlug] = useState(initialService);
  const [packageId, setPackageId] = useState(initialPackage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const submission = useRef({ fingerprint: '', id: '' });
  const status = useRef(null);
  const service = findService(serviceSlug);
  const selectedPackage = service?.packages.find(item => item.id === packageId);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.consent = data.consent === 'on';
    const fingerprint = JSON.stringify(data);
    if (submission.current.fingerprint !== fingerprint) submission.current = { fingerprint, id: crypto.randomUUID() };
    data.id = submission.current.id;
    try {
      const response = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your enquiry could not be sent. Please try again.');
      setReceipt(result);
    } catch (failure) {
      setError(failure.message === 'Failed to fetch' ? 'We could not connect. Your details are still in this form; please try again.' : failure.message);
    } finally { setBusy(false); requestAnimationFrame(() => status.current?.focus()); }
  }
  return <div className="quote-layout">
    <aside className="quote-context" aria-live="polite"><p className="service-eyebrow">Your enquiry</p><h2>{service?.title || 'Tell us what you need'}</h2>{selectedPackage && <><p>{selectedPackage.name}</p><p>{selectedPackage.price}</p><p className="service-small">Estimated delivery / schedule: {selectedPackage.timeline}</p></>}<p className="service-small">No payment is required. We will confirm scope, pricing and delivery in your quotation.</p>{service && <p><a className="service-text-link" href={`/services/${service.slug}`}>Review this service ↗</a></p>}</aside>
    {receipt ? <div className="quote-success quote-status" ref={status} tabIndex="-1" role="status"><h2>{receipt.mode === 'local' ? 'Enquiry saved for local review.' : 'Thank you for your enquiry.'}</h2><p>{receipt.mode === 'local' ? 'This preview has saved your enquiry locally. It has not been delivered to the Optitech team.' : 'Your quotation request has been received, including your selected service and package.'}</p><p>Reference: {receipt.id}</p><p>{service?.title}{selectedPackage ? ` · ${selectedPackage.name}` : ''}</p><a href="/services" className="service-button">Explore Services<Arrow /></a></div> : <form className="quote-form" onSubmit={submit} aria-busy={busy}>
      {invalidContext && <p className="quote-status" role="status">The service or package in that link is unavailable. Please select an option below.</p>}
      <fieldset className="quote-form-fields" disabled={busy}>
      <div className="quote-fields"><label>Service<select name="service" required value={serviceSlug} onChange={event => { setServiceSlug(event.target.value); setPackageId(''); }}><option value="">Select a service</option>{services.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label><label>Package<select name="package" value={packageId} disabled={!service} onChange={event => setPackageId(event.target.value)}><option value="">Help me choose / bespoke requirements</option>{service?.packages.map(item => <option key={item.id} value={item.id}>{item.name} · {item.price}</option>)}</select></label></div>
      <div className="quote-fields"><label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label><label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>Business name <span className="service-small">Optional</span><input name="business" maxLength={200} autoComplete="organization" /></label><label>Phone number <span className="service-small">Optional</span><input name="phone" type="tel" maxLength={50} autoComplete="tel" /></label></div>
      <label>Your requirements<textarea name="requirements" required minLength={10} maxLength={5000} rows={6} placeholder="Tell us about your business, goals, current website or systems, budget and preferred timing." /></label>
      <label className="quote-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex="-1" autoComplete="off" /></label>
      <label className="quote-consent"><input name="consent" type="checkbox" required /><span>I agree that Optitech may use these details to respond to my enquiry. Read our <a href="/privacy-policy">Privacy Policy</a>.</span></label>
      </fieldset>
      {error && <p className="quote-status" data-error="true" role="alert" ref={status} tabIndex="-1">{error} Your details have been kept in this form.</p>}
      <button className="service-button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Request My Free Quote'}<Arrow /></button>
      <p className="service-small">Prices are indicative. This is an enquiry, not an order or a payment.</p>
    </form>}
  </div>;
}
