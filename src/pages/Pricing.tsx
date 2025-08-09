import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "QR code menu",
        "Basic ordering system",
        "Up to 20 menu items",
        "WhatsApp support",
        "Basic analytics"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Professional",
      price: "KES 2,500",
      period: "/month",
      description: "For growing restaurants",
      features: [
        "Everything in Starter",
        "Unlimited menu items",
        "M-Pesa integration",
        "Custom branding",
        "Advanced analytics",
        "Order management dashboard",
        "Swahili & English support",
        "Priority support"
      ],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Coming Soon",
      description: "For restaurant chains",
      features: [
        "Everything in Professional",
        "Multiple locations",
        "Staff management",
        "Loyalty programs",
        "SMS campaigns",
        "API access",
        "Dedicated support"
      ],
      cta: "Join Waitlist",
      popular: false
    }
  ];

  const handleSubmitQuote = async () => {
    const form = document.querySelector('form') as HTMLFormElement;
    const formData = new FormData(form);
    
    const restaurantName = formData.get('restaurant-name') as string;
    const contactPerson = formData.get('contact-person') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const restaurantType = formData.get('restaurant-type') as string;
    const message = formData.get('message') as string;
    
    // Get selected interest areas
    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
    const interestAreas = Array.from(checkboxes).map(cb => cb.nextElementSibling?.textContent || '');

    if (!restaurantName || !contactPerson || !email || !phone || !restaurantType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-custom-quote', {
        body: {
          restaurantName,
          contactPerson,
          email,
          phone,
          restaurantType,
          interestAreas,
          message,
        },
      });

      if (error) throw error;

      toast({
        title: "Quote Request Sent!",
        description: "We'll get back to you within 24 hours with a custom quote.",
      });

      // Reset form
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Custom Pricing for Your Restaurant
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Get a tailored solution that fits your restaurant size, needs, and budget.
            <span className="text-secoondary font-semibold"> No hidden fees, no commissions.</span>
          </p>
        </div>

        {/* Contact Sales Form */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Contact Sales for Pricing</CardTitle>
              <CardDescription>
                Tell us about your restaurant and we'll create a custom quote within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="restaurant-name" className="block text-sm font-medium text-foreground mb-2">
                      Restaurant Name *
                    </label>
                    <input 
                      id="restaurant-name"
                      name="restaurant-name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="e.g., Mama Njeri's Kitchen"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-person" className="block text-sm font-medium text-foreground mb-2">
                      Contact Person *
                    </label>
                    <input 
                      id="contact-person"
                      name="contact-person" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <input 
                      id="email"
                      name="email" 
                      type="email"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Phone Number *
                    </label>
                    <input 
                      id="phone"
                      name="phone" 
                      type="tel"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="+254 700 000 000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="restaurant-type" className="block text-sm font-medium text-foreground mb-2">
                    Restaurant Type *
                  </label>
                  <select 
                    id="restaurant-type"
                    name="restaurant-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select restaurant type</option>
                    <option value="small-cafe">Small Café (1-20 tables)</option>
                    <option value="restaurant">Restaurant (20-50 tables)</option>
                    <option value="chain">Restaurant Chain (Multiple locations)</option>
                    <option value="food-court">Food Court Stall</option>
                    <option value="hotel">Hotel Restaurant</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Interest Areas (Select all that apply) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">Digital Menu & QR Codes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">QR Ordering System</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">M-Pesa Integration</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">Analytics Dashboard</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">Multi-location Support</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">Staff Management</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Additional Requirements
                  </label>
                  <textarea 
                    id="message"
                    name="message"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about your specific needs, number of locations, peak hours, etc."
                    rows={4}
                  />
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSubmitQuote}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Get Custom Quote"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Our team will contact you within 24 hours with a tailored solution and pricing.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Pricing FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Pricing FAQ
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                What are the setup costs?
              </h3>
              <p className="text-foreground/80">
                Setup is completely free. We provide onboarding, menu digitization, staff training, 
                and QR code generation at no extra cost. You only pay your monthly subscription.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                How does M-Pesa integration work?
              </h3>
              <p className="text-foreground/80">
                We handle all M-Pesa integration through Safaricom's API. Payments go directly to your 
                business M-Pesa account within minutes. We don't hold your money or charge transaction fees.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Do you support multiple restaurant branches?
              </h3>
              <p className="text-foreground/80">
                Yes! Our Enterprise solution supports multiple locations with centralized management, 
                individual branch analytics, and unified reporting across all your restaurants.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                What's included in the custom quote?
              </h3>
              <p className="text-foreground/80">
                Your custom quote includes platform access, M-Pesa integration, unlimited menu updates, 
                analytics dashboard, multilingual support, training, and ongoing technical support.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Is there a minimum contract period?
              </h3>
              <p className="text-foreground/80">
                No long-term contracts required. We offer month-to-month subscriptions. 
                However, annual payments receive significant discounts and priority support.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                What if I need custom features?
              </h3>
              <p className="text-foreground/80">
                We can develop custom features for your specific needs. Integration with existing 
                POS systems, custom reporting, and specialized workflows are available for Enterprise clients.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;