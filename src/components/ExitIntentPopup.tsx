import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Calendar } from "lucide-react";

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-md w-full border-primary shadow-2xl">
        <CardHeader className="relative">
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="text-center">
            <div className="bg-primary/10 p-3 rounded-full inline-flex mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Wait! Before You Go...</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            See how MenuHub can reduce your costs and increase efficiency. 
            Book a free 15-minute demo with our team.
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="hero" 
              className="w-full"
              onClick={() => {
                window.location.href = '/contact';
                setIsVisible(false);
              }}
            >
              Book Free Demo
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsVisible(false)}
            >
              Maybe Later
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            ✓ No obligation • ✓ 15 minutes • ✓ Custom solution
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExitIntentPopup;