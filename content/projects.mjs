// Verified on 9 October 2026. Source order is retained; no completion dates
// were published. Platform tags describe technology, never business results.
export const portfolioAttribution = 'Selected projects delivered by our technical development partner, Makezaa.';
const image = (file, alt) => ({ src: `/assets/portfolio/${file}.webp`, alt });
export const projects = [
  {
    id: 'the-workers-agency', slug: 'the-workers-agency', title: 'The Workers Agency',
    category: 'Business Website', detailCategory: 'Business Website / Agency Website',
    summary: 'A recruitment website connecting employers with staffing services and jobseekers with application routes.',
    overview: 'The Workers Agency presents recruitment services for businesses and candidates. Its white and blue interface combines clear calls to find staff or apply with sector information and dedicated employer pages.',
    features: ['Employer and candidate navigation, with contact and application links.', 'Sector pages and recruitment specialisations.', 'Service information covering temporary staffing, permanent recruitment and on-site management.', 'Responsive page layouts with expandable service information.'],
    technologies: ['WordPress', 'Elementor', 'Tailwind CSS'],
    cover: image('the-workers-agency-home', 'The Workers Agency homepage with employer and candidate calls to action'),
    gallery: [image('the-workers-agency-employers', 'The Workers Agency employer recruitment services page')],
    liveUrl: 'https://theworkersagency.com/', sourceUrl: 'https://theworkersagency.com/',
    provenance: 'Supplied as a completed project; the live website footer credits Makezaa. WordPress, Elementor and Tailwind scripts were identified in the public page.',
  },
  {
    id: 'newmrkt', slug: 'newmrkt', title: 'NewMRKT', category: 'E-commerce / Shopify', detailCategory: 'E-commerce / Shopify Store',
    summary: 'A Shopify clothing shop built around retro graphic T-shirts, editorial imagery and collection-led browsing.',
    overview: 'NewMRKT sells vintage-inspired graphic clothing. Large campaign imagery leads into product collections, while individual product pages combine photographs, size and colour choices, product details and size guides.',
    features: ['Retro T-shirt, men’s and women’s collection navigation.', 'Product photography, prices, colour and size selectors, and quantity controls.', 'Search, a shopping bag interface and customer account links.', 'Product details, size guides and shipping information.', 'Region and currency selection within the storefront.'],
    technologies: ['Shopify', 'JavaScript', 'CSS'],
    cover: image('newmrkt-home', 'NewMRKT homepage showing its retro graphic T-shirt campaign'),
    gallery: [image('newmrkt-collection', 'NewMRKT retro T-shirt collection with product photographs and prices'), image('newmrkt-product', 'NewMRKT graphic T-shirt product page with size, colour and quantity options')],
    liveUrl: 'https://www.newmrkt.com/', sourceUrl: 'https://www.newmrkt.com/',
    provenance: 'Supplied as a completed project. Shopify storefront assets and product options were verified on the live website; no sales or conversion claims are made.',
  },
  {
    id: 'an-noor', slug: 'an-noor', title: 'An-Noor', category: 'Charity Website', detailCategory: 'Charity & Donation Platform',
    summary: 'A WordPress charity website presenting its mission and initiatives alongside online donation options.',
    overview: 'An-Noor is a UK charity donation platform. Makezaa’s project description records a responsive WordPress build with Elementor Pro, charity information and Stripe and PayPal payment integration.',
    features: ['Mission and initiative pages supporting the charity’s public information.', 'Online giving with Stripe and PayPal options, as documented by Makezaa.', 'Mobile-friendly donation flows.', 'Image optimisation and caching work documented in the source portfolio.'],
    technologies: ['WordPress', 'Elementor Pro', 'WooCommerce', 'Stripe', 'PayPal'],
    cover: image('an-noor-cover', 'An-Noor charity donation platform cover published by Makezaa'), gallery: [image('an-noor-live', 'An-Noor Welfare Trust live website homepage')],
    liveUrl: 'https://annoor.co.uk/', sourceUrl: 'https://www.makezaa.com/projects/an-noor-charity-donation-platform-with-payment-integration',
    provenance: 'Project features and technologies are attributed to Makezaa’s published case study, rather than a payment transaction test.',
  },
  {
    id: 'campusflow', slug: 'campusflow', title: 'Campusflow', category: 'Web App', detailCategory: 'University Campus Workflow',
    summary: 'A routine companion for Bangladesh University, bringing academic schedules and campus information together.',
    overview: 'Campusflow organises everyday university information in one interface. The published project covers department lookup, classroom information and schedules for teachers, transport and examinations.',
    features: ['Department lookup and campus routing information.', 'Classroom and teacher schedule information.', 'Bus and examination timetables.', 'A shared interface for campus routine information.'],
    technologies: [],
    cover: image('campusflow-cover', 'Campusflow university routine application cover published by Makezaa'), gallery: [image('campusflow-live', 'Campusflow live university routine application')],
    liveUrl: 'https://campusflow.makezaa.com/', sourceUrl: 'https://www.makezaa.com/projects/campusflow-bangladesh-university',
    provenance: 'The source describes a web app, campus workflow and agentic system, but does not name its software stack.',
  },
  {
    id: 'nike-air-max-showcase', slug: 'nike-air-max-showcase', title: 'Nike Air Max Showcase', category: 'Interactive Concept', detailCategory: 'Interactive Product Showcase / Concept',
    summary: 'An animated product interface concept using GSAP and Lenis, with a gallery and cart UI feedback.',
    overview: 'This Makezaa showcase explores an animated shopping interface around Nike Air Max products. It is presented as a concept, with no claim of a Nike client commission or operational checkout.',
    features: ['GSAP animation and Lenis smooth scrolling.', 'Responsive product presentation in a dark interface.', 'Interactive product gallery and modal views.', 'Cart interface feedback as part of the showcase.'],
    technologies: ['HTML5', 'Tailwind CSS', 'JavaScript', 'GSAP', 'Lenis'],
    cover: image('nike-air-max-showcase-cover', 'Nike Air Max animated product showcase concept published by Makezaa'), gallery: [image('nike-air-max-showcase-live', 'Nike Air Max concept interface on the live Makezaa showcase')],
    liveUrl: 'https://makezaa-shoegrab-au.vercel.app/', sourceUrl: 'https://www.makezaa.com/projects/nike-air-max-showcase',
    provenance: 'Features and technology tags come from Makezaa’s showcase description. This is a concept, not a verified Nike commission.',
  },
  {
    id: 'makezaa-agent-ready-platform', slug: 'makezaa-agent-ready-platform', title: 'Makezaa Platform', category: 'Web Platform', detailCategory: 'Agent-Ready Web Platform',
    summary: 'Makezaa’s own portfolio platform, with structured content management and an authenticated agent API.',
    overview: 'Makezaa’s agency platform combines a public portfolio with content administration. Its published case study describes a headless CMS for projects, posts and contact submissions, with a token-gated API for agent access.',
    features: ['Structured projects, posts and contact submission data.', 'Portfolio covers, tags, live links and featured project controls.', 'Rich text editing, image uploads and draft-to-publish content workflows.', 'Token-gated content access for agents.'],
    technologies: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Node.js', 'Tailwind CSS', 'Vercel'],
    cover: image('makezaa-agent-ready-platform-cover', 'Makezaa agency platform homepage cover from its portfolio'), gallery: [image('makezaa-agent-ready-platform-live', 'Makezaa live agency platform homepage')],
    liveUrl: 'https://www.makezaa.com/', sourceUrl: 'https://www.makezaa.com/projects/makezaa-agent-ready-web-platform',
    provenance: 'Makezaa’s own agency platform, as described in its published project page.',
  },
  {
    id: 'golden-touch-contractors', slug: 'golden-touch-contractors', title: 'Golden Touch Contractors', category: 'Business Website', detailCategory: 'Roofing & Contractor Website',
    summary: 'A WordPress website for a Brooklyn roofing and exterior contractor, with service information and quote requests.',
    overview: 'Golden Touch Contractors presents roofing and exterior services for its New York audience. Makezaa’s project description covers a WordPress site with service pages, local contact information, project imagery and enquiry capture.',
    features: ['Roofing and exterior service pages.', 'Inline quote requests and contact capture.', 'Project gallery and blog content.', 'WordPress management of pages, posts, testimonials and gallery media.'],
    technologies: ['WordPress', 'PHP', 'HTML', 'CSS', 'JavaScript'],
    cover: image('golden-touch-contractors-cover', 'Golden Touch Contractors roofing website cover published by Makezaa'), gallery: [image('golden-touch-contractors-live', 'Golden Touch Contractors live roofing and exterior services homepage')],
    liveUrl: 'https://goldentouchcontractors.com/', sourceUrl: 'https://www.makezaa.com/projects/golden-touch-contractors-wordpress-project',
    provenance: 'Scope and technologies are recorded in Makezaa’s published contractor website case study.',
  },
];

export const portfolioSource = 'https://www.makezaa.com/projects';
export const legacyProjectSlugs = ['anaconda', 'cadillac', 'david-beckham', 'faze-x-lyrical-lemonade', 'floyd-mayweather', 'get-moving', 'neymar-jr', 'sohub-website', 'tsioulka', 'vodafone-cash', 'wanderworlds'];
