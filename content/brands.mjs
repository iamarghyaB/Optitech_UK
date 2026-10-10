export const brandsHeading = "Brands We've Worked With";
export const brandsDescription = [
  "A selection of the brands we've worked with. ",
  'From digital platforms to growing businesses, ',
  'built with care, creativity and technical expertise.',
];
export const brands = [
  { name: 'Makezaa', src: '/assets/brands/makezaa.png', source: 'https://www.makezaa.com/favicon.png' },
  { name: 'An-Noor Welfare Trust', src: '/assets/brands/an-noor.png', source: 'https://annoor.co.uk/wp-content/uploads/2026/04/Untitled-design.png' },
  { name: 'NewMRKT', src: '/assets/brands/newmrkt.png', source: 'https://www.newmrkt.com/cdn/shop/files/newmrktlogo.png?v=1786883152' },
  { name: 'Elite Studios', src: '/assets/brands/elite-studios.svg', source: 'Attached company_logo (1).svg' },
  { name: 'phoenix', src: '/assets/brands/phoenix.svg', source: 'Attached company_logo (2).svg' },
  { name: 'SuperSystem', src: '/assets/brands/supersystem.svg', source: 'Attached company_logo (3).svg' },
];

// Keep the archive's 45-entry rotation and 10/9 responsive cells.
export const brandRotation = Array.from({ length: 45 }, (_, index) => brands[index % brands.length].src);
