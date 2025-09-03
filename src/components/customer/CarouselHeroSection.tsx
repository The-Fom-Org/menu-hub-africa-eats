
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Star, ChefHat, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface HeroSlide {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  isDefault?: boolean;
}

interface CarouselHeroSectionProps {
  restaurantName: string;
  coverImageUrl?: string;
  onScrollToMenu: () => void;
  additionalSlides?: HeroSlide[];
}

export const CarouselHeroSection = ({ 
  restaurantName, 
  coverImageUrl, 
  onScrollToMenu,
  additionalSlides = []
}: CarouselHeroSectionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Create slides array with default slide first
  const slides: HeroSlide[] = [
    {
      id: 'default',
      title: `Welcome to ${restaurantName}`,
      subtitle: 'Fresh ingredients, amazing flavors',
      imageUrl: coverImageUrl,
      isDefault: true
    },
    ...additionalSlides
  ];

  useEffect(() => {
    if (!api) return;

    // Auto-scroll every 5 seconds
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    // Update current slide on selection
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    setCurrent(api.selectedScrollSnap());

    return () => {
      clearInterval(interval);
      api.off('select', onSelect);
    };
  }, [api]);

  return (
    <section className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-4 h-4 bg-primary/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-secondary/40 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-accent/50 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-primary/20 rounded-full animate-pulse delay-500"></div>
      </div>

      <Carousel setApi={setApi} className="w-full h-full">
        <CarouselContent className="h-full">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative w-full h-full bg-gradient-subtle">
                {/* Background Image with enhanced overlay */}
                {slide.imageUrl && (
                  <div className="absolute inset-0">
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title || `${restaurantName} slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-transparent to-background/80"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                )}
                
                {/* Animated Content Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-4xl mx-auto space-y-6"
                  >
                    {slide.isDefault ? (
                      <>
                        {/* Welcome Message */}
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6 }}
                          className="space-y-4"
                        >
                          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            <span className="text-sm font-semibold text-white">Welcome to</span>
                          </div>
                          
                          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight drop-shadow-xl">
                            {restaurantName}
                          </h1>
                          
                          <p className="text-xl md:text-2xl text-white/90 font-medium drop-shadow-lg">
                            Where every bite tells a story
                          </p>
                        </motion.div>

                        {/* Feature Badges */}
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="flex flex-wrap items-center justify-center gap-4 mt-8"
                        >
                          <div className="group flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-green-400/30 hover:border-green-400/50 transition-all duration-300">
                            <div className="p-2 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
                              <Clock className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="text-left">
                              <span className="text-white font-semibold text-sm block">Lightning Fast</span>
                              <span className="text-green-200 text-xs">Ready in 15 mins</span>
                            </div>
                          </div>
                          
                          <div className="group flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-amber-400/30 hover:border-amber-400/50 transition-all duration-300">
                            <div className="p-2 bg-amber-500/20 rounded-full group-hover:bg-amber-500/30 transition-colors">
                              <ChefHat className="h-5 w-5 text-amber-400" />
                            </div>
                            <div className="text-left">
                              <span className="text-white font-semibold text-sm block">Chef's Special</span>
                              <span className="text-amber-200 text-xs">Made fresh daily</span>
                            </div>
                          </div>
                          
                          <div className="group flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
                            <div className="p-2 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                              <Award className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="text-left">
                              <span className="text-white font-semibold text-sm block">5-Star Quality</span>
                              <span className="text-purple-200 text-xs">Premium ingredients</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.6 }}
                          className="mt-8"
                        >
                          <Button 
                            onClick={onScrollToMenu}
                            size="lg"
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-300"
                          >
                            <span>Explore Our Menu</span>
                            <Sparkles className="ml-2 h-5 w-5 animate-pulse" />
                          </Button>
                        </motion.div>
                      </>
                    ) : (
                      // Custom slide content with enhanced styling
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4"
                      >
                        {slide.title && (
                          <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-xl">
                            {slide.title}
                          </h2>
                        )}
                        {slide.subtitle && (
                          <p className="text-lg md:text-xl text-white/90 drop-shadow-lg max-w-2xl mx-auto">
                            {slide.subtitle}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Floating elements */}
                <div className="absolute top-1/4 left-8 w-16 h-16 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-8 w-20 h-20 bg-secondary/10 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Enhanced Navigation arrows */}
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/30 to-secondary/30 backdrop-blur-md border-white/20 text-white hover:from-primary/50 hover:to-secondary/50 h-12 w-12 rounded-2xl shadow-xl hover:scale-110 transition-all duration-300" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/30 to-secondary/30 backdrop-blur-md border-white/20 text-white hover:from-primary/50 hover:to-secondary/50 h-12 w-12 rounded-2xl shadow-xl hover:scale-110 transition-all duration-300" />
          </>
        )}
      </Carousel>

      {/* Enhanced slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                current === index 
                  ? 'w-8 h-3 bg-gradient-to-r from-primary to-secondary shadow-lg' 
                  : 'w-3 h-3 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Enhanced decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-br-full"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-secondary/20 to-transparent rounded-bl-full"></div>
    </section>
  );
};
