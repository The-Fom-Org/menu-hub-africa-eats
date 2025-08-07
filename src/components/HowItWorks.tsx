import { QrCode, Smartphone, CreditCard } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: QrCode,
      title: "1. Setup Digital Menu",
      description: "Upload menu items, set prices, add photos. Generate QR codes for tables. Takes 10 minutes.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Smartphone,
      title: "2. Customers Order",
      description: "Customers scan QR codes, browse menu on their phones, customize orders, and pay via M-Pesa or cash.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: CreditCard,
      title: "3. Manage Orders",
      description: "Receive orders on WhatsApp or dashboard. Track sales, update inventory, analyze performance daily.",
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How MenuHub Integrates Into Your Daily Operations
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Seamlessly fits into your restaurant workflow - from setup to daily operations, orders, and payments.
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

        {/* Integration Benefits */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-hero text-primary-foreground text-sm font-medium mb-4">
            ⚡ Integrates with your existing workflow
          </div>
          <p className="text-muted-foreground mb-6">
            No disruption to your kitchen operations. Orders flow naturally through your preferred channels.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;