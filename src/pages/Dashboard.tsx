import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionData } from "@/hooks/useSubscriptionData";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";
import { 
  Menu, 
  QrCode, 
  Palette, 
  CreditCard, 
  BarChart3, 
  Crown,
  Settings,
  ClipboardList,
  Users
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { subscriptionData, loading: checkingSubscription, refetch } = useSubscriptionData(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasSubscriptionAccess = subscriptionData?.subscribed || subscriptionData?.managed_by_sales;

  const dashboardItems = [
    {
      title: "Digital Menu",
      description: "View and share your restaurant's digital menu",
      icon: Menu,
      href: "/digital-menu",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      available: true
    },
    {
      title: "Edit Menu",
      description: "Add, edit, or remove menu items and categories",
      icon: Settings,
      href: "/edit-menu",
      color: "text-green-600",
      bgColor: "bg-green-50",
      available: true
    },
    {
      title: "Orders",
      description: "View and manage incoming customer orders",
      icon: ClipboardList,
      href: "/orders",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      available: true
    },
    {
      title: "QR Code",
      description: "Generate and download QR codes for your menu",
      icon: QrCode,
      href: "/qr-code",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      available: true
    },
    {
      title: "Custom Branding",
      description: "Customize your menu's appearance and branding",
      icon: Palette,
      href: "/custom-branding",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      available: true
    },
    {
      title: "Enable Payments",
      description: "Set up payment methods for online orders",
      icon: CreditCard,
      href: "/enable-payments",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      available: true
    },
    {
      title: "Analytics",
      description: "View insights about your menu performance",
      icon: BarChart3,
      href: "/analytics",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      available: true
    },
    {
      title: "Manage Subscription",
      description: "View and manage your subscription plan",
      icon: Crown,
      href: "/manage-subscription",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      available: hasSubscriptionAccess
    },
    {
      title: "Customer Leads",
      description: "View and manage customer lead capture data",
      icon: Users,
      href: "/customer-leads",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <DashboardHeader 
            subscriptionData={subscriptionData}
            checkingSubscription={checkingSubscription}
            onRefreshSubscription={refetch}
          />

          <DashboardGrid items={dashboardItems} />

          {!hasSubscriptionAccess && <UpgradePrompt />}

          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Check our documentation or contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
