
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { RestaurantInfo } from '@/hooks/useCustomerMenuData';

interface HeroSectionProps {
  restaurantInfo: RestaurantInfo;
  customerFlow: 'qr' | 'direct';
}

export const HeroSection = ({ restaurantInfo, customerFlow }: HeroSectionProps) => {
  return (
    <section className="relative h-80 overflow-hidden bg-gradient-to-r from-primary/90 to-secondary/90">
      {/* Background Image */}
      {restaurantInfo.cover_image_url && (
        <div className="absolute inset-0">
          <img 
            src={restaurantInfo.cover_image_url} 
            alt={`${restaurantInfo.name} hero`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center text-white max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Freshly made, just for you
          </h1>
          <p className="text-xl md:text-2xl mb-6 opacity-90">
            Ready in 15 minutes
          </p>
          
          {/* Quick Info Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm"
            >
              {customerFlow === 'qr' ? (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Dine In Experience
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Pre-order Available
                </>
              )}
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm"
            >
              🔥 Fresh & Hot
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm"
            >
              ⚡ Fast Service
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};
