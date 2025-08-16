
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle, Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    message: ''
  });
  const { toast } = useToast();

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "WhatsApp Support",
      description: "Get instant help via WhatsApp",
      action: "Message us now",
      link: "https://wa.me/254791829358",
      available: "24/7 Support"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us detailed questions",
      action: "hello MenuHubAfrica",
      link: "mailto:menuhubafrica@gmail.com",
      available: "Response within 2 hours"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our team",
      action: "+254 115888525",
      link: "tel:+254115888525",
      available: "Mon-Fri 8AM-6PM EAT"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.restaurantName || !formData.contactPerson || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 2 hours.",
      });

      // Reset form
      setFormData({
        restaurantName: '',
        contactPerson: '',
        email: '',
        phone: '',
        location: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact us directly via WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about MenuHub? Our local team is here to help you get started 
              and succeed with digital ordering.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {contactMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-warm transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="bg-primary/10 p-4 rounded-2xl inline-flex mx-auto mb-4">
                      <method.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{method.title}</CardTitle>
                    <p className="text-muted-foreground">{method.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-accent">
                        <Clock className="h-4 w-4" />
                        <span>{method.available}</span>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={method.link} target="_blank" rel="noopener noreferrer">
                          {method.action}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl mx-auto">
              <Card className="border-border/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you within 2 hours.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="restaurantName" className="block text-sm font-medium text-foreground mb-2">
                          Restaurant Name *
                        </label>
                        <Input 
                          id="restaurantName" 
                          placeholder="e.g., Mama Njeri's Kitchen"
                          value={formData.restaurantName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-foreground mb-2">
                          Contact Person *
                        </label>
                        <Input 
                          id="contactPerson" 
                          placeholder="Your name"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                          Email Address *
                        </label>
                        <Input 
                          id="email" 
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                          Phone Number
                        </label>
                        <Input 
                          id="phone" 
                          type="tel"
                          placeholder="+254 700 000 000"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                        Restaurant Location
                      </label>
                      <Input 
                        id="location" 
                        placeholder="e.g., Westlands, Nairobi"
                        value={formData.location}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                        How can we help? *
                      </label>
                      <Textarea 
                        id="message"
                        placeholder="Tell us about your restaurant and what you're looking for..."
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <Button 
                      variant="hero" 
                      size="lg" 
                      className="w-full"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      By submitting this form, you agree to our privacy policy. 
                      We'll only use your information to help with your inquiry.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Visit Our Office
              </h2>
              <p className="text-muted-foreground">
                Based in Nairobi, serving restaurants across Kenya and East Africa.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="border-border/50">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="flex items-start gap-3 mb-6">
                        <MapPin className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">MenuHub Africa HQ</h3>
                          <p className="text-muted-foreground">
                            Westlands, Nairobi<br/>
                            Kenya, East Africa
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM EAT</p>
                        <p><strong>Support:</strong> Available 24/7 via WhatsApp</p>
                        <p><strong>Languages:</strong> English, Swahili</p>
                      </div>

                      <Button variant="outline" className="mt-6" asChild>
                        <a href="https://wa.me/254791829358" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp us now
                        </a>
                      </Button>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6 text-center">
                      <div className="bg-primary/10 p-4 rounded-full inline-flex mb-4">
                        <MapPin className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">
                        🇰🇪 Proudly Kenyan
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Built by locals who understand African restaurants, 
                        payment methods, and customer preferences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
