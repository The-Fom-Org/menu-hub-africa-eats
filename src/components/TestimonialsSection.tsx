import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Coming Soon",
      restaurant: "First Partner Restaurant",
      location: "Nairobi, Kenya",
      text: "Stories from our first 10 partner restaurants coming soon. Be among the first to share your success story.",
      rating: 5,
      isPlaceholder: true,
    },
    {
      name: "Restaurant Owner",
      restaurant: "Growing Chain",
      location: "Mombasa, Kenya",
      text: "Experience how MenuHub transforms restaurant operations with digital ordering and real-time analytics.",
      rating: 5,
      isPlaceholder: true,
    },
    {
      name: "Café Manager",
      restaurant: "Local Favorite",
      location: "Kisumu, Kenya",
      text: "Join our early adopters and see the impact of going paperless with QR menus and mobile payments.",
      rating: 5,
      isPlaceholder: true,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Restaurant Owner Success Stories
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join Kenya's leading restaurants who've transformed their operations with MenuHub.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className={`border-border/50 hover:shadow-warm transition-all duration-300 ${
                testimonial.isPlaceholder ? 'bg-gradient-to-br from-primary/5 to-secondary/5' : ''
              }`}
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Quote className="h-8 w-8 text-primary/40" />
                </div>
                
                <p className={`text-foreground mb-6 leading-relaxed ${
                  testimonial.isPlaceholder ? 'italic text-muted-foreground' : ''
                }`}>
                  {testimonial.text}
                </p>
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <div className="border-t border-border/50 pt-4">
                  <h4 className={`font-semibold text-foreground ${
                    testimonial.isPlaceholder ? 'text-muted-foreground' : ''
                  }`}>
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.restaurant} • {testimonial.location}
                  </p>
                  {testimonial.isPlaceholder && (
                    <p className="text-xs text-primary mt-2 font-medium">
                      ✨ Coming Soon
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Ready to be featured in our success stories?
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-hero text-secondary-foreground text-sm font-medium">
            🚀 Early adopter benefits available
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;