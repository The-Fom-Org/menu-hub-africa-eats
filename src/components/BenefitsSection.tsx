import { QrCode, Smartphone, BarChart3, CreditCard } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: QrCode,
      title: "Digital Menus with QR Codes",
      description: "Instant updates, no reprinting costs. Customers scan and browse on their phones.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: CreditCard,
      title: "Instant M-Pesa Payments",
      description: "Secure mobile payments that customers trust. Money in your account instantly.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Smartphone,
      title: "Real-time Menu Updates",
      description: "Change prices, add specials, mark items as sold out - updates are instant.",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track orders, popular items, peak hours, and revenue to optimize your business.",
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Go Digital
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete restaurant digitization in one platform - built specifically for African businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${benefit.color} group-hover:scale-110 transition-transform duration-300 mb-6`}>
                <benefit.icon className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-4">
                {benefit.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;