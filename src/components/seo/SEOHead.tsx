
import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  restaurantName?: string;
  location?: string;
}

export const SEOHead = ({
  title,
  description,
  keywords,
  ogImage = "https://menuhub.lovable.app/menuhub.png",
  ogType = "website",
  canonicalUrl,
  restaurantName,
  location = "Kenya"
}: SEOHeadProps) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'The Menu Hub Kenya');
    updateMetaTag('robots', 'index, follow');

    // OpenGraph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', 'The Menu Hub Kenya', true);
    if (canonicalUrl) updateMetaTag('og:url', canonicalUrl, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@menuhubkenya');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Local business tags
    if (restaurantName) {
      updateMetaTag('business:contact_data:locality', location);
      updateMetaTag('business:contact_data:country_name', 'Kenya');
      updateMetaTag('place:location:latitude', '-1.2921');
      updateMetaTag('place:location:longitude', '36.8219');
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Breadcrumb schema
    if (restaurantName) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://menuhub.lovable.app"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": restaurantName,
            "item": canonicalUrl
          }
        ]
      };

      let breadcrumbScript = document.querySelector('script[data-type="breadcrumb"]') as HTMLScriptElement;
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.type = 'application/ld+json';
        breadcrumbScript.setAttribute('data-type', 'breadcrumb');
        document.head.appendChild(breadcrumbScript);
      }
      breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
    }
  }, [title, description, keywords, ogImage, ogType, canonicalUrl, restaurantName, location]);

  return null;
};
