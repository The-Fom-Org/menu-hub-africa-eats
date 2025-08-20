
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export function UpgradePrompt() {
  const navigate = useNavigate();

  return (
    <Card className="mt-8 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          Unlock Premium Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Contact our sales team to unlock premium features including subscription management, 
          advanced analytics, and priority support.
        </p>
        <Button variant="outline" onClick={() => navigate("/contact")}>
          Contact Sales
        </Button>
      </CardContent>
    </Card>
  );
}
