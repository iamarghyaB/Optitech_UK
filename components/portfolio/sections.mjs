// These sections use the archived detail page's existing text, grid and link
// classes. The same renderer is embedded in its client module and used for SSR.
export function createPortfolioSections({ jsx, jsxs }) {
  const labelClass = 'flex items-center gap-2 text-[#707070] text-sm mb-4';
  const heading = text => jsx('h2', { className: labelClass, children: text });
  const textClass = 'text-[#434343] text-xl lg:text-4xl tracking-tight font-[400] leading-none w-full md:w-2/3 xl:w-[45%] text-balance';
  const linkClass = 'text-[#434343] tracking-tighter border-b border-[#434343] hover:opacity-60 transition-opacity duration-300';
  return {
    summary: p => jsxs('div', { className: 'px-6 md:px-12 mt-8 portfolio-summary', children: [
      jsxs('nav', { 'aria-label': 'Breadcrumb', className: 'text-[#707070] text-sm mb-4', children: [jsx('a', { href: '/work', className: linkClass, children: 'Work' }), ' / ', jsx('span', { 'aria-current': 'page', children: p.title })] }),
      jsx('p', { className: 'text-[#707070] text-sm mb-4', children: p.detailCategory }),
      jsx('p', { className: 'text-[#434343] text-xl tracking-tight w-full md:w-2/3', children: p.summary }),
    ] }),
    overview: p => jsxs('section', { className: 'w-screen relative flex flex-col py-16 md:py-32 px-6 md:px-12 z-10 portfolio-overview', children: [heading('Project Overview'), jsx('p', { className: textClass, children: p.overview }), jsx('p', { className: 'text-[#707070] text-sm mt-8', children: 'Selected projects delivered by our technical development partner, Makezaa.' })] }),
    details: p => jsxs('section', { className: 'w-screen relative flex flex-col gap-16 py-16 md:py-32 px-6 md:px-12 z-10 portfolio-details', children: [
      jsxs('div', { children: [heading('What Was Built'), jsx('ul', { className: 'flex flex-col gap-4 text-[#434343] text-xl tracking-tight w-full md:w-2/3', children: p.features.map(feature => jsx('li', { className: 'border-b border-black/20 pb-4', children: feature }, feature)) })] }),
      jsxs('div', { children: [heading('Technologies Used'), jsx('p', { className: 'text-[#434343] text-xl tracking-tight w-full md:w-2/3', children: p.technologies.length ? p.technologies.join(' · ') : 'The public project description does not specify the technology stack.' })] }),
    ] }),
    closing: (p, next) => jsxs('section', { className: 'w-screen relative flex flex-col gap-16 py-16 md:py-32 px-6 md:px-12 z-10 portfolio-details', children: [
      jsxs('div', { className: 'flex flex-col items-start gap-4', children: [p.liveUrl && jsx('a', { href: p.liveUrl, target: '_blank', rel: 'noopener noreferrer', className: linkClass, children: 'Visit Live Website ↗' }), jsx('a', { href: p.sourceUrl, target: '_blank', rel: 'noopener noreferrer', className: 'text-[#707070] text-sm hover:opacity-60 transition-opacity duration-300', children: 'Project source ↗' })] }),
      jsxs('div', { className: 'flex flex-col items-start gap-6 border-t border-black/20 pt-12', children: [jsx('h2', { className: 'text-[#434343] text-3xl md:text-4xl tracking-tight leading-none', children: 'Have a Similar Project in Mind?' }), jsx('p', { className: 'text-[#5E5E5E] text-xl tracking-tight w-full md:w-2/3', children: "Let's discuss how we can design and develop the right digital solution for your business." }), jsx('a', { href: '/contact/quote', className: linkClass, children: 'Start Your Project ↗' })] }),
      next && jsxs('nav', { 'aria-label': 'Related projects', className: 'flex flex-col items-start gap-4', children: [heading('Explore More Work'), jsx('a', { href: `/work/${next.slug.current}`, className: linkClass, children: `${next.title} ↗` }), jsx('a', { href: '/work', className: 'text-[#707070] text-sm hover:opacity-60 transition-opacity duration-300', children: 'All projects' })] }),
    ] }),
  };
}
