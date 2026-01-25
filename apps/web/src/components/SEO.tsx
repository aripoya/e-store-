import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, any>;
}

export const SEO = ({ 
  title = 'JogjaBootcamp - Transformasi Digital UMKM dengan AI',
  description = 'Platform edukasi digital #1 untuk UMKM Indonesia. Belajar transformasi bisnis ke era digital dengan AI dari praktisi berpengalaman. Gratis!',
  image = 'https://jogjabootcamp.com/og-image.jpg',
  url = 'https://estore.jogjabootcamp.com',
  jsonLd
}: SEOProps) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      <link rel="canonical" href={url} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
