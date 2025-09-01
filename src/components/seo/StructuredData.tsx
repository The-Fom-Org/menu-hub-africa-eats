
import { useEffect } from 'react';

interface RestaurantData {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  logoUrl?: string;
  menuItems?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
  }>;
}

interface StructuredDataProps {
  type: 'restaurant' | 'menu' | 'homepage';
  restaurantData?: RestaurantData;
  pageUrl?: string;
}

export const StructuredData = ({ type, restaurantData, pageUrl }: StructuredDataProps) => {
  useEffect(() => {
    const removeExistingStructuredData = () => {
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());
    };

    const addStructuredData = (data: any) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    removeExistingStructuredData();

    if (type === 'homepage') {
      // Organization schema for homepage
      const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "The Menu Hub Kenya",
        "alternateName": "MenuHub",
        "url": "https://menuhub.lovable.app",
        "logo": "https://menuhub.lovable.app/menuhub.png",
        "description": "Digital menu solutions for African restaurants. QR code menus, mobile ordering, M-Pesa payments, and commission-free pricing.",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "KE",
          "addressRegion": "Nairobi"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": ["English", "Swahili"]
        },
        "sameAs": [
          "https://twitter.com/menuhubkenya",
          "https://facebook.com/menuhubkenya"
        ],
        "areaServed": {
          "@type": "Country",
          "name": "Kenya"
        },
        "serviceType": "Restaurant Technology Solutions"
      };

      // Software Application schema
      const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MenuHub Digital Menu System",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "description": "Complete digital menu solution for restaurants with QR ordering, M-Pesa integration, and real-time order management.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "KES",
          "description": "Commission-free pricing starting from KSh 2,000/month"
        },
        "featureList": [
          "QR Code Menus",
          "Mobile Ordering",
          "M-Pesa Integration",
          "Real-time Notifications",
          "Order Management",
          "Customer Analytics"
        ]
      };

      addStructuredData(organizationSchema);
      addStructuredData(softwareSchema);
    }

    if (type === 'restaurant' && restaurantData) {
      // Restaurant schema
      const restaurantSchema = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": restaurantData.name,
        "description": restaurantData.description,
        "image": restaurantData.logoUrl,
        "telephone": restaurantData.phone,
        "url": pageUrl,
        "priceRange": "$$",
        "servesCuisine": "African",
        "acceptsReservations": true,
        "hasMenu": `${pageUrl}#menu`,
        "paymentAccepted": ["M-Pesa", "Cash", "Card"],
        "currenciesAccepted": "KES"
      };

      addStructuredData(restaurantSchema);
    }

    if (type === 'menu' && restaurantData?.menuItems) {
      // Menu schema
      const menuSchema = {
        "@context": "https://schema.org",
        "@type": "Menu",
        "name": `${restaurantData.name} Menu`,
        "description": `Digital menu for ${restaurantData.name}`,
        "hasMenuSection": [
          {
            "@type": "MenuSection",
            "name": "Menu Items",
            "hasMenuItem": restaurantData.menuItems.map(item => ({
              "@type": "MenuItem",
              "name": item.name,
              "description": item.description,
              "image": item.image_url,
              "offers": {
                "@type": "Offer",
                "price": item.price,
                "priceCurrency": "KES"
              }
            }))
          }
        ]
      };

      addStructuredData(menuSchema);
    }

    return () => {
      removeExistingStructuredData();
    };
  }, [type, restaurantData, pageUrl]);

  return null;
};
