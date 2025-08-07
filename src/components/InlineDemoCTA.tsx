import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface InlineDemoCTAProps {
  title?: string;
  description?: string;
  variant?: "default" | "compact";
}

const InlineDemoCTA = ({ 
  title = "Ready to Transform Your Restaurant?", 
  description = "Book a free demo and see how MenuHub can reduce costs and increase efficiency.",
  variant = "default" 
}: InlineDemoCTAProps) => {
  if (variant === "compact") {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="hero" className="shrink-0" asChild>
          <Link to="/contact">
            <Calendar className="h-4 w-4 mr-2" />
            Book Demo
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-8 text-center">
        <div className="bg-primary/10 p-4 rounded-2xl inline-flex mb-6">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-4">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/contact">
              <Calendar className="h-5 w-5 mr-2" />
              Book Free Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild>
            <Link to="/pricing">
              Get Custom Quote
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          ✓ 15-minute consultation • ✓ Custom solution • ✓ No obligation
        </p>
      </CardContent>
    </Card>
  );
};

export default InlineDemoCTA;