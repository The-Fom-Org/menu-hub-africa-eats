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
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-secondary text-sm font-medium mb-6">
              🇰🇪 Built for African Restaurants
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Digital Menus &{" "}
              <span className="text-secondary">QR Ordering</span> for Modern
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
        </div>
          
      </div>
    </section>
  );
};

export default HeroSection;