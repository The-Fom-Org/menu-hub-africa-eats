import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CallWaiterDialogProps {
  restaurantId: string;
  children: React.ReactNode;
}

export const CallWaiterDialog = ({ restaurantId, children }: CallWaiterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        .from('waiter_calls')
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || null,
          notes: notes.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Waiter called",
        description: `A waiter has been notified for table ${tableNumber}`,
      });
      
      setOpen(false);
      setTableNumber("");
      setCustomerName("");
      setNotes("");
    } catch (error) {
      console.error('Error calling waiter:', error);
      toast({
        title: "Request failed",
        description: "Could not notify the waiter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call a Waiter
          </DialogTitle>
          <DialogDescription>
            Tell us your table number so a waiter can assist you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table">Table number *</Label>
            <Input
              id="table"
              placeholder="e.g., 5 or A3"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Your name (optional)</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Additional notes (optional)</Label>
            <Textarea
              id="note"
              placeholder="Any additional details for the waiter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
              Call Waiter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};