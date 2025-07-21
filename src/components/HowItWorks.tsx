import { QrCode, Smartphone, CreditCard } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: QrCode,
      title: "Generate QR Menu",
      description: "Create beautiful digital menus with photos, prices in KSh, and descriptions in English & Swahili.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Smartphone,
      title: "Customers Scan & Order",
      description: "Diners scan QR codes at tables, browse your menu on their phones, and place orders instantly.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: CreditCard,
      title: "Get Paid Instantly",
      description: "Accept M-Pesa payments or cash. Orders come to your WhatsApp or dashboard. No commission fees.",
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How MenuHub Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get your restaurant online in minutes with our simple 3-step process designed for African businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              {/* Step Number */}
              <div className="relative mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-4">
                {step.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Connecting Line (not on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border transform translate-x-4 -translate-y-8" />
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-hero text-primary-foreground text-sm font-medium mb-4">
            ⚡ Setup takes less than 10 minutes
          </div>
          <p className="text-muted-foreground mb-6">
            Start serving customers digitally today, no technical knowledge required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;