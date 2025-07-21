import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Pricing = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Start free, scale as you grow. No setup fees, no hidden costs.
            <span className="text-primary font-semibold"> Zero commission</span> on orders.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-elegant scale-105' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline justify-center gap-1 mt-4">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-foreground/60">{plan.period}</span>
                  )}
                </div>
                <CardDescription className="text-foreground/70 mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "hero" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Why no commission fees?
              </h3>
              <p className="text-foreground/80">
                We believe restaurants should keep 100% of their revenue. Our subscription model 
                ensures predictable costs while you focus on serving great food.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Is M-Pesa integration included?
              </h3>
              <p className="text-foreground/80">
                Yes! M-Pesa integration is included in the Professional plan, making it easy 
                for customers to pay directly through their mobile phones.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Can I switch plans anytime?
              </h3>
              <p className="text-foreground/80">
                Absolutely. You can upgrade, downgrade, or cancel your subscription at any time. 
                Changes take effect at your next billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Do you offer support in Swahili?
              </h3>
              <p className="text-foreground/80">
                Yes! Our platform and support are available in both English and Swahili 
                to serve restaurants across East Africa.
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