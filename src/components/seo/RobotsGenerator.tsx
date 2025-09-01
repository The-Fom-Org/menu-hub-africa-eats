
import { useEffect } from 'react';

export const RobotsGenerator = () => {
  useEffect(() => {
    const generateRobotsTxt = () => {
      const robotsContent = `User-agent: *
Allow: /
Allow: /menu/*
Allow: /restaurant/*
Disallow: /dashboard
Disallow: /admin
Disallow: /login
Disallow: /signup
Disallow: /checkout
Disallow: /orders
Disallow: /analytics
Disallow: /manage-subscription

# Sitemaps
Sitemap: https://menuhub.lovable.app/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Allow specific bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Block aggressive crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /`;

      // Store robots.txt content in localStorage for now (in production, this would be a static file)
      localStorage.setItem('robots.txt', robotsContent);
      console.log('Robots.txt generated:', robotsContent);
    };

    generateRobotsTxt();
  }, []);

  return null;
};
