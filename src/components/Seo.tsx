import { Helmet } from 'react-helmet-async';
import type { ReactNode } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
  children: ReactNode;
}

const SITE_URL = 'https://noxlabs.net';
const DEFAULT_TITLE = 'NOX Labs — High-End AI Systems';
const DEFAULT_DESCRIPTION =
  'NOX Labs baut KI-Systeme für Lead-Generierung, Qualifizierung, Workflow-Automatisierung und skalierbare Business-Infrastruktur. Strukturiert. Messbar. Ohne Kompromisse.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function Seo({
  title,
  description,
  path = '',
  ogImage,
  jsonLd,
  noIndex = false,
  children,
}: SeoProps) {
  const fullTitle = title ? `${title} — NOX Labs` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path}`;
  const imageUrl = ogImage || DEFAULT_OG_IMAGE;

  return (
    <>
      <Helmet>
        {/* Core */}
        <title>{fullTitle}</title>
        <meta name="description" content={desc} />
        {noIndex && <meta name="robots" content="noindex, nofollow" />}

        {/* Canonical */}
        <link rel="canonical" href={url} />

        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:site_name" content="NOX Labs" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={imageUrl} />

        {/* JSON-LD */}
        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>
      {children}
    </>
  );
}
