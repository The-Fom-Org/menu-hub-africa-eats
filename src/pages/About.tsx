import { Heart, Globe, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Built for Africa",
      description: "Designed specifically for African restaurants with local payment methods, languages, and cultural understanding."
    },
    {
      icon: Globe,
      title: "Local-First Approach",
      description: "Supporting English and Swahili with plans to expand to more local languages across the continent."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "We listen to restaurant owners and build features that solve real problems in the African market."
    },
    {
      icon: Zap,
      title: "Simple & Powerful",
      description: "Complex technology made simple. Get started in minutes, not days."
    }
  ];

  const team = [
    {
      name: "Sarah Kimani",
      role: "Co-Founder & CEO",
      description: "Former restaurant manager with 8 years experience in Nairobi's food scene."
    },
    {
      name: "David Mwangi",
      role: "Co-Founder & CTO", 
      description: "Software engineer passionate about solving local challenges with technology."
    },
    {
      name: "Grace Ochieng",
      role: "Head of Customer Success",
      description: "Hospitality expert helping restaurants succeed in the digital age."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Empowering African Restaurants
          </h1>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            MenuHub Africa was born from a simple observation: African restaurants needed 
            digital solutions built for Africa, not adapted from elsewhere. We're here to 
            bridge that gap with technology that understands our markets, our languages, 
            and our way of doing business.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-gradient-subtle rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <p>
                It started in a busy restaurant in Nairobi. Sarah, a restaurant manager, 
                watched customers struggle with paper menus while others waited to place orders. 
                She knew there had to be a better way – one that worked for African restaurants 
                and their customers.
              </p>
              <p>
                Existing solutions were expensive, complex, and didn't understand the local market. 
                They charged high commissions, didn't support M-Pesa, and weren't available in Swahili. 
                That's when Sarah partnered with David, a local software engineer, to build something different.
              </p>
              <p>
                MenuHub Africa is the result – a platform built from the ground up for African 
                restaurants. We understand that every shilling matters, that M-Pesa is essential, 
                and that serving customers in their preferred language makes all the difference.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            What Drives Us
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-border hover:shadow-elegant transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="bg-gradient-hero rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Meet the Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-border">
                <CardContent className="pt-8 pb-6">
                  <div className="bg-gradient-subtle rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-foreground/70 leading-relaxed">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 text-center text-primary-foreground mb-20">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl leading-relaxed max-w-3xl mx-auto mb-8">
            To empower every restaurant in Africa with digital tools that are 
            simple, affordable, and built for our unique market. We believe 
            technology should enhance the dining experience, not complicate it.
          </p>
          <Button variant="secondary" size="lg">
            Join Our Mission
          </Button>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants already using MenuHub Africa to serve 
            their customers better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;