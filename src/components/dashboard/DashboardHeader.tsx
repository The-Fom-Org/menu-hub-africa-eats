
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, RefreshCw } from "lucide-react";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  managed_by_sales?: boolean;
}

interface DashboardHeaderProps {
  subscriptionData: SubscriptionData | null;
  checkingSubscription: boolean;
  onRefreshSubscription: () => void;
}

export function DashboardHeader({ 
  subscriptionData, 
  checkingSubscription, 
  onRefreshSubscription 
}: DashboardHeaderProps) {
  const hasSubscriptionAccess = subscriptionData?.subscribed || subscriptionData?.managed_by_sales;

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Manage your restaurant's digital presence.
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {subscriptionData && (
          <div className="text-right">
            {hasSubscriptionAccess ? (
              <Badge variant="default" className="mb-1">
                <Crown className="h-3 w-3 mr-1" />
                {subscriptionData.subscription_tier || 'Active'}
              </Badge>
            ) : (
              <Badge variant="outline" className="mb-1">
                Free Plan
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshSubscription}
              disabled={checkingSubscription}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${checkingSubscription ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
