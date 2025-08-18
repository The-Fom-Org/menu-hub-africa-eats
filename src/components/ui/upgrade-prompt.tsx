
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  compact?: boolean;
}

export const UpgradePrompt = ({ title, description, feature, compact = false }: UpgradePromptProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{feature} - Premium Feature</span>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/manage-subscription')}
            className="ml-4"
          >
            Upgrade
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          size="lg" 
          onClick={() => navigate('/manage-subscription')}
          className="w-full"
        >
          View Plans & Upgrade
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Unlock {feature} with Standard or Advanced plans
        </p>
      </CardContent>
    </Card>
  );
};
