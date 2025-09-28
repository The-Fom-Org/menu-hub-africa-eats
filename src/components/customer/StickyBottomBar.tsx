import { Button } from "@/components/ui/button";
import { CallWaiterDialog } from "@/components/customer/CallWaiterDialog";
import { Phone, ChefHat } from "lucide-react";

interface StickyBottomBarProps {
  restaurantId: string;
  onChefsSpecial: () => void;
  orderingEnabled?: boolean;
}

export const StickyBottomBar = ({ restaurantId, onChefsSpecial, orderingEnabled = true }: StickyBottomBarProps) => {
  // Don't show bottom bar if ordering is disabled
  if (!orderingEnabled) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-lg">
      <div className="container mx-auto px-2 py-3">
        <div className="flex justify-between items-center gap-2">
          <CallWaiterDialog restaurantId={restaurantId}>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 group flex items-center gap-2 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Phone className="h-3 w-3 text-primary" />
              </div>
              <span className="font-medium text-sm">Call Waiter</span>
            </Button>
          </CallWaiterDialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onChefsSpecial}
            className="flex-1 flex items-center gap-2 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 border hover:border-amber-200"
          >
            <ChefHat className="h-3 w-3" />
            <span className="font-medium text-sm">Chef's Special</span>
          </Button>
        </div>
      </div>
    </div>
  );
};