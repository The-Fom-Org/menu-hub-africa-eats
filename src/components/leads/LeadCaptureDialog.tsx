
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type LeadSource = "qr_scan" | "menu_browse" | "pre_checkout" | "post_order" | "exit_intent";

const leadSchema = z.object({
  customer_name: z.string().min(2, "Please enter the customer's name"),
  customer_phone: z
    .string()
    .min(7, "Phone number looks too short")
    .max(20, "Phone number looks too long"),
  customer_email: z.string().email("Invalid email").optional().or(z.literal("")),
  marketing_consent: z.boolean().default(false),
  dietary_restrictions: z.string().optional(),
  favorite_cuisines: z.string().optional(),
  dining_frequency: z.enum(["weekly", "monthly", "occasionally"]).optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadCaptureDialogProps {
  restaurantId: string;
  leadSource?: LeadSource;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onSubmitted?: () => void;
  /**
   * Optional custom order context to send with the lead.
   * If omitted, we'll try to gather a summary from the cart via useLeadCapture().
   */
  orderContext?: Record<string, any>;
}

export const LeadCaptureDialog: React.FC<LeadCaptureDialogProps> = ({
  restaurantId,
  leadSource = "menu_browse",
  trigger,
  defaultOpen = false,
  onSubmitted,
  orderContext,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { orderContext: derivedOrderContext } = useLeadCapture();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      marketing_consent: false,
      dietary_restrictions: "",
      favorite_cuisines: "",
      dining_frequency: undefined,
      notes: "",
    },
    mode: "onTouched",
  });

  const effectiveOrderContext = orderContext ?? derivedOrderContext;

  const onSubmit = async (values: LeadFormValues) => {
    if (!restaurantId) {
      toast({
        title: "Missing restaurant",
        description: "We couldn't determine which restaurant this lead belongs to.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const payload = {
      restaurant_id: restaurantId,
      customer_name: values.customer_name.trim(),
      customer_phone: values.customer_phone.trim(),
      customer_email: values.customer_email?.trim() || null,
      lead_source: leadSource,
      order_context: effectiveOrderContext || {},
      marketing_consent: !!values.marketing_consent,
      dietary_restrictions: values.dietary_restrictions
        ? values.dietary_restrictions.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      favorite_cuisines: values.favorite_cuisines
        ? values.favorite_cuisines.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      dining_frequency: values.dining_frequency || null,
      notes: values.notes || null,
    };

    const { error } = await supabase.from("customer_leads").insert([payload]);

    if (error) {
      console.error("Lead insert error:", error);
      toast({
        title: "Failed to save",
        description: "We couldn't save this lead. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    toast({
      title: "Lead captured",
      description: "Thanks! We'll keep you updated with offers.",
    });
    setSubmitting(false);
    setOpen(false);
    form.reset();
    onSubmitted?.();
  };

  const disabled = !restaurantId || submitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get offers and updates</DialogTitle>
          <DialogDescription>
            Share your details to receive special offers and updates from this restaurant.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Wanjiru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 07xx xxx xxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dining_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How often do you dine?</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="occasionally">Occasionally</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketing_consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Receive offers via WhatsApp/SMS</FormLabel>
                        {/* No message needed here */}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dietary_restrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary restrictions (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. vegetarian, gluten-free" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favorite_cuisines"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite cuisines (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kenyan, Ethiopian, BBQ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Anything else you'd like us to know?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled} variant="hero">
                {submitting ? "Saving..." : "Get Offers"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {!restaurantId && (
          <p className="mt-2 text-sm text-destructive">
            Restaurant not specified — pass a restaurantId prop to enable submission.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
