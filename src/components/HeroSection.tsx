import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-restaurant.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-subtle overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="African restaurant with digital menus"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/70" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              🇰🇪 Built for African Restaurants
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Digital Menus &{" "}
              <span className="text-primary">QR Ordering</span> for Modern
              African Restaurants
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Reduce printing costs by 80%, speed up service by 50%, eliminate order errors, 
              and enhance customer experience with digital QR menus and M-Pesa integration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button variant="hero" size="xl" className="group" asChild>
                <Link to="/contact">
                  Book a Demo
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button variant="outline" size="xl" className="group" asChild>
                <Link to="/signup">
                  Start Free
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background" />
                  <div className="w-8 h-8 rounded-full bg-secondary/20 border-2 border-background" />
                  <div className="w-8 h-8 rounded-full bg-accent/20 border-2 border-background" />
                </div>
                <span>Join 50+ restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">✓</span>
                <span>Free to start • No setup fees</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="relative lg:pl-8 animate-scale-in">
            <div className="relative bg-card rounded-2xl shadow-warm p-8 border border-border/50">
              <div className="aspect-[3/4] bg-gradient-hero rounded-xl p-6 flex flex-col justify-between text-primary-foreground">
                {/* Mock Phone Interface */}
                <div className="text-center">
                  <div className="bg-white/20 rounded-lg p-4 mb-4">
                    <div className="w-20 h-20 mx-auto bg-white/30 rounded-lg flex items-center justify-center mb-2">
                      <div className="w-12 h-12 bg-foreground/20 rounded" />
                    </div>
                    <p className="text-sm">Scan QR Code</p>
                  </div>
                  <h3 className="font-semibold mb-2">Mama Njeri's Kitchen</h3>
                  <p className="text-sm opacity-90">Traditional Kenyan Cuisine</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm font-medium">Nyama Choma</p>
                    <p className="text-xs opacity-75">KSh 800</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm font-medium">Ugali & Sukuma</p>
                    <p className="text-xs opacity-75">KSh 300</p>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full">
                    Order via WhatsApp
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-3 py-2 rounded-lg shadow-soft text-sm font-medium">
              No Commission!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg shadow-soft text-sm font-medium">
              M-Pesa Ready
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;