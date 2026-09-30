/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  ...(process.env.VERCEL === '1' ? {
    outputFileTracingExcludes: { '/*': ['./assets/**/*', './public/assets/**/*'] },
    outputFileTracingIncludes: { '/*': ['./index.html', './pages/**/*', './routes.json', './reference-assets.json'] },
  } : {}),
  async rewrites() {
    return {
      // Preserve the original image endpoint and cache keys. Next's optimizer
      // must not replace the original images or reject their localized URLs.
      beforeFiles: [{ source: '/_next/image', destination: '/api/reference-image' }],
      afterFiles: [],
      fallback: [],
    };
  },
};
export default nextConfig;
