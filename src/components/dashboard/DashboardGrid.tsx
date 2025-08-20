
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DashboardItem {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  bgColor: string;
  available: boolean;
}

interface DashboardGridProps {
  items: DashboardItem[];
}

export function DashboardGrid({ items }: DashboardGridProps) {
  const navigate = useNavigate();
  const availableItems = items.filter(item => item.available);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card 
            key={item.title} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate(item.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
