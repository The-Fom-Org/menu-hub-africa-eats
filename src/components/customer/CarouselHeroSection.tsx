
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Star } from 'lucide-react';
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
    <section className="relative h-[35vh] min-h-[250px] max-h-[400px] overflow-hidden">
      <Carousel setApi={setApi} className="w-full h-full">
        <CarouselContent className="h-full">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20">
                {/* Background Image */}
                {slide.imageUrl && (
                  <div className="absolute inset-0">
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title || `${restaurantName} slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                  </div>
                )}
                
                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3 text-white">
                  <div className="max-w-2xl mx-auto space-y-2">
                    {slide.isDefault ? (
                      // Default slide content with the original speed and freshness cues
                      <div className="flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base flex-wrap">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Ready in 15 minutes</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-medium">Freshly made, just for you</span>
                        </div>
                      </div>
                    ) : (
                      // Custom slide content
                      <div className="space-y-2">
                        {slide.title && (
                          <h2 className="text-xl md:text-2xl font-bold">
                            {slide.title}
                          </h2>
                        )}
                        {slide.subtitle && (
                          <p className="text-sm md:text-base text-white/90">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation arrows - only show if more than 1 slide */}
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30" />
          </>
        )}
      </Carousel>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                current === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent"></div>
    </section>
  );
};
