import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  /** Page-level title — will be appended with " | PipFactor" */
  title: string;
  /** Concise meta description (≤160 chars) */
  description: string;
  /** Absolute canonical URL for this route */
  canonical: string;
  /** Prevent search-engine indexing (auth-gated / utility pages) */
  noIndex?: boolean;
  /** JSON-LD structured data block to inject for this page */
  structuredData?: object | object[];
}

const BASE_OG_IMAGE = "https://pipfactor.com/og-image.png";

export const SEOHead = ({
  title,
  description,
  canonical,
  noIndex = false,
  structuredData,
}: SEOHeadProps) => {
  const fullTitle = `${title} | PipFactor`;

  // Normalise structuredData to an array so we can map over it
  const schemas = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={BASE_OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PipFactor" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={BASE_OG_IMAGE} />

      {/* Structured data — one <script> block per schema object */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
