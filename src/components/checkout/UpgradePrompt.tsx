
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  description: string;
  upgradeUrl?: string;
}

export const UpgradePrompt = ({ feature, description, upgradeUrl = '/pricing' }: UpgradePromptProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Crown className="h-5 w-5" />
          Upgrade Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            <strong>{feature}</strong> requires a Standard or Advanced plan. {description}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate(upgradeUrl)}
          className="w-full"
          variant="default"
        >
          Upgrade Now
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
