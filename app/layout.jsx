export const metadata = {
  title: 'Pensatori Irrazionali',
  robots: { index: false, follow: false },
};

// Shared shell for future native Next.js pages. Preserved reference documents
// have their own complete HTML shell and are served by the compatibility route.
export default function RootLayout({ children }) {
  return <html lang="en"><body style={{ margin: 0 }}>{children}</body></html>;
}
