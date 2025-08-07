import { Link } from "react-router-dom";
import { 
  QrCode, 
  Smartphone, 
  CreditCard, 
  BarChart3, 
  Palette, 
  Globe,
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InlineDemoCTA from "@/components/InlineDemoCTA";

const FeaturesPreview = () => {
  const features = [
    {
      icon: QrCode,
      title: "QR Code Menus",
      description: "Instantly generate QR codes for tables. Customers scan and browse your full menu on their phones.",
      highlight: "No app download required",
    },
    {
      icon: Smartphone,
      title: "Phone-Based Ordering",
      description: "Orders come directly to your WhatsApp or dashboard. Simple for customers, easy for you.",
      highlight: "Works on any phone",
    },
    {
      icon: CreditCard,
      title: "M-Pesa Integration",
      description: "Accept mobile payments instantly with M-Pesa. Also supports cash and card payments.",
      highlight: "0% commission fees",
    },
    {
      icon: Palette,
      title: "Brand Customization",
      description: "Upload your logo, choose colors, and customize your menu to match your restaurant's style.",
      highlight: "Your brand, your way",
    },
    {
      icon: BarChart3,
      title: "Simple Analytics",
      description: "Track popular dishes, peak hours, and customer preferences with easy-to-understand reports.",
      highlight: "Data-driven decisions",
    },
    {
      icon: Globe,
      title: "English & Swahili",
      description: "Serve all customers with bilingual menus. Switch languages with one tap.",
      highlight: "Truly local solution",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            💡 Everything you need
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for African Restaurants
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Local payment methods, multilingual support, and zero commission fees. 
            MenuHub understands what African restaurants need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-warm hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/20"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                    {feature.highlight}
                  </span>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-subtle rounded-2xl p-8 lg:p-12 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
            Why African Restaurants Choose MenuHub
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">0%</div>
              <p className="text-muted-foreground">Commission fees<br/>Keep all your earnings</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">2</div>
              <p className="text-muted-foreground">Languages supported<br/>English & Swahili</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">10min</div>
              <p className="text-muted-foreground">Setup time<br/>Start serving today</p>
            </div>
          </div>

          <InlineDemoCTA 
            title="Ready to Transform Your Restaurant?"
            description="Join the digital revolution and give your customers the modern dining experience they expect while reducing your operational costs."
            variant="compact"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesPreview;