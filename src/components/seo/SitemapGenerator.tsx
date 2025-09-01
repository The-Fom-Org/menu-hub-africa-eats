
import { useEffect } from 'react';

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const SitemapGenerator = () => {
  useEffect(() => {
    const generateSitemap = () => {
      const baseUrl = 'https://menuhub.lovable.app';
      const now = new Date().toISOString();

      const sitemapEntries: SitemapEntry[] = [
        {
          url: baseUrl,
          lastmod: now,
          changefreq: 'weekly',
          priority: 1.0
        },
        {
          url: `${baseUrl}/about`,
          lastmod: now,
          changefreq: 'monthly',
          priority: 0.8
        },
        {
          url: `${baseUrl}/features`,
          lastmod: now,
          changefreq: 'monthly',
          priority: 0.8
        },
        {
          url: `${baseUrl}/pricing`,
          lastmod: now,
          changefreq: 'weekly',
          priority: 0.9
        },
        {
          url: `${baseUrl}/contact`,
          lastmod: now,
          changefreq: 'monthly',
          priority: 0.7
        },
        {
          url: `${baseUrl}/login`,
          lastmod: now,
          changefreq: 'monthly',
          priority: 0.5
        },
        {
          url: `${baseUrl}/signup`,
          lastmod: now,
          changefreq: 'monthly',
          priority: 0.6
        }
      ];

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      // Store sitemap in localStorage for now (in production, this would be generated server-side)
      localStorage.setItem('sitemap', sitemapXml);
      console.log('Sitemap generated:', sitemapXml);
    };

    generateSitemap();
  }, []);

  return null;
};
