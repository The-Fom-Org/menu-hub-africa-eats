import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  QrCode, 
  Smartphone, 
  CreditCard, 
  BarChart3, 
  Palette, 
  Globe,
  Clock,
  Shield,
  Users,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Features = () => {
  const mainFeatures = [
    {
      icon: QrCode,
      title: "QR Code Generation",
      description: "Instantly create QR codes for each table. Customers scan and access your menu immediately.",
      benefits: [
        "Unique QR codes for each table",
        "Instant menu access",
        "No app download required",
        "Works on any smartphone"
      ]
    },
    {
      icon: Smartphone,
      title: "Mobile-First Ordering",
      description: "Orders flow directly to your preferred channel - WhatsApp, SMS, or dashboard.",
      benefits: [
        "WhatsApp integration",
        "SMS notifications",
        "Real-time order updates",
        "Customer contact info"
      ]
    },
    {
      icon: CreditCard,
      title: "M-Pesa Integration",
      description: "Accept mobile money payments instantly with Kenya's most trusted payment method.",
      benefits: [
        "Instant M-Pesa payments",
        "Automatic payment confirmation",
        "Cash option available",
        "Zero transaction fees"
      ]
    },
    {
      icon: Palette,
      title: "Brand Customization",
      description: "Make your digital menu reflect your restaurant's unique style and personality.",
      benefits: [
        "Upload your logo",
        "Custom color schemes",
        "Font selection",
        "Layout customization"
      ]
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Understand your customers better with detailed insights and reports.",
      benefits: [
        "Popular dish tracking",
        "Peak hour analysis",
        "Customer preferences",
        "Revenue insights"
      ]
    },
    {
      icon: Globe,
      title: "Bilingual Support",
      description: "Serve all your customers with seamless English and Swahili menu options.",
      benefits: [
        "English & Swahili menus",
        "One-tap language switch",
        "Cultural food descriptions",
        "Local currency (KSh)"
      ]
    }
  ];

  const additionalFeatures = [
    { icon: Clock, title: "Real-time Updates", description: "Change menu items, prices, and availability instantly" },
    { icon: Shield, title: "Secure & Reliable", description: "Bank-level security with 99.9% uptime guarantee" },
    { icon: Users, title: "Multi-location Support", description: "Manage multiple restaurant locations from one dashboard" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Everything Your Restaurant Needs to Go Digital
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              From QR menus to M-Pesa payments, MenuHub provides all the tools 
              African restaurants need to serve customers in the digital age.
            </p>
            <Button variant="hero" size="xl">
              Start Free Trial
            </Button>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {mainFeatures.map((feature, index) => (
                <Card key={index} className="border-border/50 hover:shadow-warm transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Plus Many More Features
              </h2>
              <p className="text-xl text-muted-foreground">
                We're constantly adding new features based on feedback from African restaurants.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {additionalFeatures.map((feature, index) => (
                <div key={index} className="text-center group hover:scale-105 transition-transform">
                  <div className="bg-secondary/10 p-4 rounded-2xl inline-flex mb-4 group-hover:bg-secondary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join restaurants across Kenya who are already serving customers digitally 
              with MenuHub Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="xl">
                Get Started Free
              </Button>
              <Button variant="outline" size="xl" className="border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;