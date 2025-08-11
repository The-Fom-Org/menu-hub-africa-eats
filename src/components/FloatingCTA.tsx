import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useCustomerMenuData } from "@/hooks/useCustomerMenuData";

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const { restaurantId } = useParams();
  
  // Check if we're on customer-side pages
  const isCustomerPage = location.pathname.includes('/menu/') || location.pathname === '/checkout';
  const { restaurantInfo } = useCustomerMenuData(restaurantId || '');
  
  // Use restaurant contact for customer pages, or default MenuHub contact for other pages
  const contactNumber = isCustomerPage && restaurantInfo?.phone_number ? restaurantInfo.phone_number : '254791829358';
  const contactText = isCustomerPage ? 'Contact Restaurant' : 'Talk to Sales';

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        variant="hero"
        size="lg"
        className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
        onClick={() => window.open(`https://wa.me/${contactNumber}`, '_blank')}
      >
        <MessageCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
        {contactText}
      </Button>
      
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -top-2 -right-2 bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground w-6 h-6 rounded-full text-xs font-bold transition-colors"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default FloatingCTA;