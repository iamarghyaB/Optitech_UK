// This plain-JS renderer is shared by archived SSR and its compiled client module.
export function createServiceRow(runtime, React, Scramble) {
  const { jsx, jsxs } = runtime;
  return function ServiceRow({ service }) {
    const scramble = React.useRef(null);
    const hover = () => { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) scramble.current?.start(); };
    const arrow = key => jsx('svg', { width: '100%', className: key === 'first' ? 'group-hover:translate-x-[120%] transition-transform duration-0 group-hover:duration-200 ease-out' : 'absolute -translate-x-[120%] group-hover:translate-x-0 transition-transform duration-0 group-hover:duration-200 ease-out', viewBox: '0 0 18 14', fill: 'none', children: jsx('path', { d: 'M11 13L17 7L11 1M16 7H1', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }) }, key);
    return jsx('a', { href: `/services/${service.slug}`, onMouseEnter: hover, onFocus: hover,
      className: `w-full cursor-pointer group tracking-tighter relative z-10 project-item project-item-${service.slug}`,
      children: jsxs('div', { className: 'w-full border-y border-[#303030]/10 flex flex-row items-center justify-between relative project-item-inner', children: [
        jsx('span', { className: 'text-[#434343] text-[2rem] md:text-[3.8rem] leading-[0.75] project-item-title', children: jsx(Scramble, { text: service.title, ref: scramble, autoStart: false, scrambleSpeed: 40, scrambledLetterCount: service.title.length, characters: 'abcdefghijklmnopqrstuvwxyz', wrap: true }) }),
        jsxs('div', { className: 'project-item-inner-right', children: [jsx('span', { className: 'home-service-meta', children: service.category }), jsxs('span', { className: 'flex items-center justify-center min-w-3 w-3 text-[#5E5E5E] overflow-hidden relative project-item-arrow', 'aria-hidden': true, children: [arrow('first'), arrow('second')] })] }),
      ] }),
    });
  };
}

// Module replacement is scoped to the original homepage Projects module (438942).
export function homeServicesModule(e) {
  'use strict';
  const runtime = e.i(819009), React = e.i(137686), gsap = e.i(989777).gsap;
  const useGsap = e.i(348280).default, Marquee = e.i(794479).default, Scramble = e.i(776916).default;
  // The builder replaces this identifier with the shared renderer's source.
  const Row = CREATE_SERVICE_ROW(runtime, React, Scramble);
  function reveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timeline = gsap.timeline({ id: 'home-projects', scrollTrigger: { trigger: '.home-projects', start: 'top 75%' } });
    timeline.fromTo('.home-projects .project-item-title, .home-projects .project-item-inner', { y: '5%', opacity: 0, filter: 'blur(8px)', pointerEvents: 'none' }, { y: '0%', opacity: 1, pointerEvents: 'auto', filter: 'blur(0px)', duration: 1.6, stagger: .05 });
    return () => timeline.kill();
  }
  e.s(['default', 0, function HomeServices({ projects }) {
    useGsap(reveal, []);
    return runtime.jsxs(runtime.Fragment, { children: [
      runtime.jsx('div', { className: 'mt-30 md:mt-60 w-screen relative z-10', children: runtime.jsx(Marquee, { title: 'What We Do', number: 1, serviceDirectory: true, imageSRC: '/static/images/angelWithSword.png', imageSizes: '(min-width: 768px) 24rem, 16rem' }) }),
      runtime.jsx('div', { className: 'w-screen px-6 md:px-12 pt-32 md:pt-44 pb-20 md:pb-40 flex flex-col home-projects home-services-directory', id: 'services', children: runtime.jsxs('div', { className: 'w-full flex flex-col xl:flex-row gap-8 xl:gap-0 mt-8', children: [
        runtime.jsx('div', { className: 'w-full xl:w-1/2 flex flex-col gap-8 xl:pr-4', children: projects.slice(0, 4).map(service => runtime.jsx(Row, { service }, service.slug)) }),
        runtime.jsx('div', { className: 'w-full xl:w-1/2 flex flex-col gap-8 xl:pl-4', children: projects.slice(4).map(service => runtime.jsx(Row, { service }, service.slug)) }),
      ] }) }),
    ] });
  }]);
}
