
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorks from "@/components/HowItWorks";
import TestimonialsSection from "@/components/TestimonialsSection";
import FeaturesPreview from "@/components/FeaturesPreview";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { SitemapGenerator } from "@/components/seo/SitemapGenerator";
import { RobotsGenerator } from "@/components/seo/RobotsGenerator";

const Index = () => {
  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="The Menu Hub Kenya - Digital Menus & QR Ordering for African Restaurants"
        description="Transform your African restaurant with QR code menus, mobile ordering, M-Pesa payments, and commission-free pricing. Built for Kenyan and East African restaurants."
        keywords="digital menu kenya, qr code menu, restaurant technology kenya, mobile ordering kenya, m-pesa payments, african restaurant solutions, nairobi restaurant technology, digital transformation restaurants, menuhub kenya"
        canonicalUrl={currentUrl}
        ogType="website"
      />
      
      <StructuredData 
        type="homepage" 
        pageUrl={currentUrl}
      />
      
      <SitemapGenerator />
      <RobotsGenerator />
      
      <Header />
      <main>
        <HeroSection />
        <BenefitsSection />
        <HowItWorks />
        <TestimonialsSection />
        <FeaturesPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
