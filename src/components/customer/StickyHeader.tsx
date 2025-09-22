import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartDrawer } from "./CartDrawer";
import { 
  Search, 
  ChefHat, 
  Phone, 
  Menu, 
  X,
  MapPin,
  Clock,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StickyHeaderProps {
  restaurantName: string;
  restaurantId: string;
  logoUrl?: string;
  onSearch?: (query: string) => void;
  onChefsSpecial?: () => void;
  onContactRestaurant?: () => void;
  orderingEnabled?: boolean;
}

export const StickyHeader = ({
  restaurantName,
  restaurantId,
  logoUrl,
  onSearch,
  onChefsSpecial,
  onContactRestaurant,
  orderingEnabled = true
}: StickyHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    setIsSearchOpen(false);
  };

  const handleChefsSpecial = () => {
    onChefsSpecial?.();
    setIsMobileMenuOpen(false);
  };

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
          <div className="flex items-center space-x-2">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={`${restaurantName} logo`}
                className="h-5 w-5 object-cover rounded-xl border-2 border-primary/20"
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground truncate max-w-[80px] sm:max-w-none">
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChefsSpecial}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <ChefHat className="h-4 w-4" />
              Chef's Special
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContactRestaurant}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Contact
            </Button>
            
            {orderingEnabled && <CartDrawer restaurantId={restaurantId} />}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {orderingEnabled && <CartDrawer restaurantId={restaurantId} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSearch}
              className="border-t border-border/50 py-4"
            >
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

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
                onClick={handleChefsSpecial}
                className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Chef's Special
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleContactRestaurant}
                className="w-full justify-start"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Restaurant
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};