
import { Button } from '@/components/ui/button';
import { Clock, Star } from 'lucide-react';

interface HeroSectionProps {
  restaurantName: string;
  coverImageUrl?: string;
  onScrollToMenu: () => void;
}

export const HeroSection = ({ restaurantName, coverImageUrl, onScrollToMenu }: HeroSectionProps) => {
  return (
    <section className="relative h-[35vh] min-h-[250px] max-h-[300px] overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
      {/* Background Image */}
      {coverImageUrl && (
        <div className="absolute inset-0">
          <img 
            src={coverImageUrl} 
            alt={`${restaurantName} featured dish`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      )}
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3 text-white">
        <div className="max-w-2xl mx-auto space-y-3">
                    
          {/* Scarcity + Speed Cue */}
          <div className="flex items-center justify-center gap-2 md:gap-3 text-sm md:text-lg flex-wrap">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Ready in 15 minutes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">Freshly made, just for you</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent"></div>
    </section>
  );
};
