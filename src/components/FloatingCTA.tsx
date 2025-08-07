import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        variant="hero"
        size="lg"
        className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
        onClick={() => window.open('https://wa.me/254700000000', '_blank')}
      >
        <MessageCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
        Talk to Sales
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