import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartDrawer } from "./CartDrawer";
import { PaymentStatusChecker } from "@/components/payment/PaymentStatusChecker";
import { 
  Search, 
  ChefHat, 
  Phone, 
  Menu, 
  X,
  MapPin,
  Clock,
  Star,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StickyHeaderProps {
  restaurantName: string;
  restaurantId: string;
  logoUrl?: string;
  onContactRestaurant?: () => void;
}

export const StickyHeader = ({
  restaurantName,
  restaurantId,
  logoUrl,
  onContactRestaurant
}: StickyHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleContactRestaurant = () => {
    onContactRestaurant?.();
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-[100] bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Restaurant Name */}
          <div className="flex items-center space-x-3">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={`${restaurantName} logo`}
                className="h-10 w-10 object-cover rounded-xl border-2 border-primary/20"
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground truncate max-w-[150px] sm:max-w-none">
                {restaurantName}
              </h1>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                <span>Premium Quality</span>
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            
            <PaymentStatusChecker>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 group flex items-center gap-2 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <div className="p-1.5 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
              <span className="font-medium text-sm">Check Payment</span>
            </Button>
          </PaymentStatusChecker>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContactRestaurant}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Contact
            </Button>
            
            <CartDrawer restaurantId={restaurantId} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <CartDrawer restaurantId={restaurantId} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/50 py-4 space-y-2"
            >
              
              <Button
                variant="ghost"
                onClick={handleContactRestaurant}
                className="w-full justify-start"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Restaurant
              </Button>

              <PaymentStatusChecker>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 group flex items-center gap-2 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="p-1.5 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="font-medium text-sm">Check Payment</span>
                </Button>
              </PaymentStatusChecker>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};