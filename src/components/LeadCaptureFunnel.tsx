import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Phone, 
  MessageCircle, 
  Mail, 
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";

const LeadCaptureFunnel = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const funnelSteps = [
    {
      id: 1,
      title: "Lead Magnet",
      description: "Free Restaurant Digital Transformation Guide",
      components: ["Exit Intent Popup", "Homepage CTA", "Blog Content Offers"],
    },
    {
      id: 2,
      title: "Demo Booking",
      description: "Scheduled consultation with sales team",
      components: ["Calendly Integration", "Contact Form", "WhatsApp Chat"],
    },
    {
      id: 3,
      title: "Qualification",
      description: "Assess restaurant needs and fit",
      components: ["Discovery Questions", "Needs Assessment", "Budget Qualification"],
    },
    {
      id: 4,
      title: "Demo Delivery",
      description: "Customized product demonstration",
      components: ["Live Demo", "ROI Calculator", "Case Study Presentation"],
    },
    {
      id: 5,
      title: "Follow-up Sequence",
      description: "Nurture leads toward decision",
      components: ["Email Sequence", "WhatsApp Follow-up", "Social Proof Sharing"],
    }
  ];

  const leadMagnets = [
    {
      title: "Free Digital Menu Setup",
      description: "We'll digitize your first 20 menu items for free",
      icon: <Calendar className="h-6 w-6" />,
      value: "KSh 5,000 value",
      cta: "Claim Free Setup"
    },
    {
      title: "Restaurant ROI Calculator",
      description: "Calculate potential savings and revenue increase",
      icon: <TrendingUp className="h-6 w-6" />,
      value: "Instant results",
      cta: "Calculate Savings"
    },
    {
      title: "Digital Transformation Guide",
      description: "Complete guide to restaurant digitization in Kenya",
      icon: <Star className="h-6 w-6" />,
      value: "30-page guide",
      cta: "Download Free"
    }
  ];

  const touchpoints = [
    {
      channel: "Website Forms",
      description: "Contact forms on all key pages",
      frequency: "Multiple per page",
      purpose: "Capture initial interest"
    },
    {
      channel: "WhatsApp Chat",
      description: "Direct conversation with sales team",
      frequency: "Instant response",
      purpose: "Immediate qualification"
    },
    {
      channel: "Phone Calls",
      description: "Scheduled discovery calls",
      frequency: "15-30 minutes",
      purpose: "Deep needs assessment"
    },
    {
      channel: "Email Sequences",
      description: "Automated nurture campaigns",
      frequency: "3-5 emails over 2 weeks",
      purpose: "Education and trust building"
    },
    {
      channel: "Demo Bookings",
      description: "Live product demonstrations",
      frequency: "30-45 minutes",
      purpose: "Show value and close"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Sales & Marketing Strategy
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Sales Qualified Lead Capture Funnel
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive lead capture and nurturing system designed to convert restaurant owners 
            into MenuHub customers through multiple touchpoints and personalized experiences.
          </p>
        </div>

        {/* Funnel Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Lead Capture Funnel Stages
          </h2>
          
          <div className="grid lg:grid-cols-5 gap-6">
            {funnelSteps.map((step, index) => (
              <Card 
                key={step.id} 
                className={`cursor-pointer transition-all duration-300 ${
                  currentStep === step.id ? 'border-primary shadow-elegant scale-105' : 'hover:shadow-warm'
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    currentStep === step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.id}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {step.description}
                  </p>
                  <div className="space-y-2">
                    {step.components.map((component, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs block text-center">
                        {component}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Lead Magnets */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Lead Magnets & Value Propositions
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {leadMagnets.map((magnet, index) => (
              <Card key={index} className="border-border/50 hover:shadow-warm transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="bg-primary/10 p-4 rounded-2xl inline-flex mx-auto mb-4">
                    {magnet.icon}
                  </div>
                  <CardTitle className="text-xl">{magnet.title}</CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {magnet.value}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6">
                    {magnet.description}
                  </p>
                  <Button variant="hero" className="w-full">
                    {magnet.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Touchpoint Strategy */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Multi-Channel Touchpoint Strategy
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {touchpoints.map((touchpoint, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                      {touchpoint.channel === "Website Forms" && <Mail className="h-5 w-5 text-primary" />}
                      {touchpoint.channel === "WhatsApp Chat" && <MessageCircle className="h-5 w-5 text-primary" />}
                      {touchpoint.channel === "Phone Calls" && <Phone className="h-5 w-5 text-primary" />}
                      {touchpoint.channel === "Email Sequences" && <Mail className="h-5 w-5 text-primary" />}
                      {touchpoint.channel === "Demo Bookings" && <Calendar className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">
                        {touchpoint.channel}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {touchpoint.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {touchpoint.frequency}
                        </Badge>
                        <span className="text-muted-foreground">
                          {touchpoint.purpose}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Success Metrics */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                Expected Results & KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">15%</div>
                  <p className="text-sm text-muted-foreground">Website to Lead Conversion</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">60%</div>
                  <p className="text-sm text-muted-foreground">Demo Show Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">25%</div>
                  <p className="text-sm text-muted-foreground">Demo to Close Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">7 days</div>
                  <p className="text-sm text-muted-foreground">Average Sales Cycle</p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-background/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Implementation Priority:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>1. Setup WhatsApp Business API for instant lead response</p>
                  <p>2. Implement exit-intent popups with lead magnets</p>
                  <p>3. Create email nurture sequences with local case studies</p>
                  <p>4. Build demo booking calendar with automatic follow-ups</p>
                  <p>5. Train sales team on consultative selling approach</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadCaptureFunnel;