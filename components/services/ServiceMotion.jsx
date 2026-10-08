'use client';

import { useEffect } from 'react';

// Content remains visible if JavaScript fails; motion honours the visitor's preference.
export default function ServiceMotion() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations = [];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        animations.push(entry.target.animate([
          { transform: 'translateY(5%)', opacity: 0, filter: 'blur(8px)' },
          { transform: 'translateY(0)', opacity: 1, filter: 'blur(0px)' },
        ], { duration: 1600, easing: 'cubic-bezier(.22,1,.36,1)' }));
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -15% 0px' });
    document.querySelectorAll('[data-service-reveal]').forEach(element => observer.observe(element));
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, []);
  return null;
}
