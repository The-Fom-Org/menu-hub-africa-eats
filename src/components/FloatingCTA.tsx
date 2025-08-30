import { MessageCircle, Phone, BellRing, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useCustomerMenuData } from "@/hooks/useCustomerMenuData";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [openCallDialog, setOpenCallDialog] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wink, setWink] = useState(false);

  const { toast } = useToast();
  const location = useLocation();
  const { restaurantId } = useParams();
  
  // Check if we're on customer-side pages
  const isCustomerPage = location.pathname.includes('/menu/') || location.pathname === '/checkout';
  const { restaurantInfo } = useCustomerMenuData(restaurantId || '');
  
  // Use restaurant contact for customer pages, or default MenuHub contact for other pages
  const contactNumber = isCustomerPage && restaurantInfo?.phone_number ? restaurantInfo.phone_number : '254791829358';
  const contactText = isCustomerPage ? 'Contact Restaurant' : 'Talk to Sales';

  // Always set the site title for SEO
  useEffect(() => {
    document.title = "The Menu Hub Kenya";
  }, []);

  // Wink animation that briefly shows "Call Waiter" label
  useEffect(() => {
    if (!isCustomerPage) return;
    const interval = setInterval(() => {
      setWink(true);
      const t = setTimeout(() => setWink(false), 1400);
      return () => clearTimeout(t);
    }, 6500);
    return () => clearInterval(interval);
  }, [isCustomerPage]);

  const handleCreateWaiterCall = async () => {
    if (!restaurantId) {
      toast({
        title: "Missing restaurant",
        description: "Unable to detect the restaurant for this menu.",
        variant: "destructive",
      });
      return;
    }
    if (!tableNumber.trim()) {
      toast({
        title: "Table number required",
        description: "Please enter your table number so staff can find you quickly.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('waiter_calls' as any)
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber.trim(),
          notes: note.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Waiter called",
        description: `A waiter has been notified. Table ${tableNumber}.`,
      });
      setOpenCallDialog(false);
      setTableNumber("");
      setNote("");
    } catch (e: any) {
      console.error('Failed to create waiter call', e);
      toast({
        title: "Request failed",
        description: "Could not notify the waiter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      {/* Tiny "Call Waiter" button shown on customer pages */}
      {isCustomerPage && (
        <div className="flex flex-col items-end gap-3 mb-3">
          <div className="relative">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Call Waiter"
              className="h-10 w-10 rounded-full shadow-md hover-scale"
              onClick={() => setOpenCallDialog(true)}
            >
              <BellRing className="h-5 w-5" />
            </Button>

            {/* Wink label */}
            <span
              className={`absolute right-12 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground shadow ${
                wink ? "opacity-100 animate-fade-in" : "opacity-0 pointer-events-none"
              }`}
            >
              Call Waiter
            </span>
          </div>
        </div>
      )}

      {/* Existing CTA button */}
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

      {/* Call Waiter Dialog */}
      <Dialog open={openCallDialog} onOpenChange={setOpenCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call a Waiter</DialogTitle>
            <DialogDescription>
              Tell us your table number so a waiter can assist you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table">Table number</Label>
              <Input
                id="table"
                placeholder="e.g., 5 or A3"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Optional note</Label>
              <Textarea
                id="note"
                placeholder="Any additional details for the waiter"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCallDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWaiterCall} disabled={submitting}>
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Call Waiter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FloatingCTA;
