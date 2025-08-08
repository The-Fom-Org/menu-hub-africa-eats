import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  category_id: string;
  image_url?: string;
}

export interface CustomerMenuCategory {
  id: string;
  name: string;
  description: string;
  menu_items?: CustomerMenuItem[];
}

export interface RestaurantInfo {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  tagline?: string;
  primary_color?: string;
  secondary_color?: string;
}

export const useCustomerMenuData = (restaurantId: string) => {
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use the user_id as restaurant_id since we don't have a separate restaurants table
      // In a real implementation, you'd want a separate restaurants table
      const { data: categoriesData, error: categoriesError } = await (supabase as any)
        .from('menu_categories')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('user_id', restaurantId)
        .order('created_at', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Filter only available items
      const filteredCategories = categoriesData?.map((category: any) => ({
        ...category,
        menu_items: category.menu_items?.filter((item: any) => item.is_available) || []
      })) || [];

      setCategories(filteredCategories);

      // Fetch restaurant profile info
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', restaurantId)
        .single();

      if (profileData) {
        setRestaurantInfo({
          id: restaurantId,
          name: profileData.restaurant_name || "MenuHub Restaurant",
          description: profileData.description || "Delicious meals made with love",
          logo_url: profileData.logo_url,
          cover_image_url: profileData.cover_image_url,
          tagline: profileData.tagline,
          primary_color: profileData.primary_color,
          secondary_color: profileData.secondary_color,
        });
      } else {
        setRestaurantInfo({
          id: restaurantId,
          name: "MenuHub Restaurant",
          description: "Delicious meals made with love",
          logo_url: undefined,
          cover_image_url: undefined,
        });
      }

    } catch (error) {
      console.error('Error fetching menu data:', error);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchMenuData();
    }
  }, [restaurantId]);

  return {
    categories,
    restaurantInfo,
    loading,
    error,
    refetch: fetchMenuData,
  };
};