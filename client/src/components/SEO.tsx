import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export function SEO({ 
  title = "CryptoBot Pro - Trading Automatisé & Alertes IA", 
  description = "Automatisez vos gains crypto avec notre bot de trading IA. Surveillance 24/7, analyse de sentiment et exécution ultra-rapide. Commencez gratuitement.",
  keywords = "bot trading crypto, trading automatique bitcoin, robot trading ia, revenus passifs crypto, scalping bot, swing trading automatisé",
  image = "/og-image.jpg",
  url = "https://cryptobot-pro.manus.app"
}: SEOProps) {
  const siteTitle = title.includes("CryptoBot Pro") ? title : `${title} | CryptoBot Pro`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
  );
}
