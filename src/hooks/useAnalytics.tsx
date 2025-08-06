import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularItems: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  dailyOrders: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    popularItems: [],
    dailyOrders: [],
    monthlyRevenue: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch orders for the current user's restaurant
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (
              name,
              price
            )
          )
        `)
        .eq('restaurant_id', user.id);

      if (ordersError) throw ordersError;

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate popular items
      const itemCounts: Record<string, { orders: number; revenue: number }> = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const itemName = item.menu_item?.name || 'Unknown Item';
          if (!itemCounts[itemName]) {
            itemCounts[itemName] = { orders: 0, revenue: 0 };
          }
          itemCounts[itemName].orders += item.quantity;
          itemCounts[itemName].revenue += item.quantity * Number(item.unit_price);
        });
      });

      const popularItems = Object.entries(itemCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // Calculate daily orders for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyOrders = last7Days.map(date => {
        const dayOrders = orders?.filter(order => 
          order.created_at.startsWith(date)
        ) || [];
        
        return {
          date,
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
        };
      });

      // Calculate monthly revenue for the last 6 months
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          year: date.getFullYear(),
          month: date.getMonth()
        };
      }).reverse();

      const monthlyRevenue = last6Months.map(({ year, month }) => {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthOrders = orders?.filter(order => 
          order.created_at.startsWith(monthStr)
        ) || [];
        
        return {
          month: new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
        };
      });

      setAnalytics({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        popularItems,
        dailyOrders,
        monthlyRevenue
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set dummy data on error to show the interface
      setAnalytics({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        popularItems: [],
        dailyOrders: [],
        monthlyRevenue: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
};