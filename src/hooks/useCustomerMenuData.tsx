
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
  // New persuasion-related fields
  persuasion_description?: string | null;
  is_chef_special?: boolean | null;
  popularity_badge?: 'most-popular' | 'chef-pick' | 'bestseller' | null;
  // For upsell categorization and filtering
  category_name?: string;
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
  phone_number?: string;
}

/**
 * Hook to fetch customer-facing menu data and restaurant information.
 * 
 * @param urlParamId - The user ID from the URL (typically from QR codes like /menu/:restaurantId)
 *                     This gets resolved to the actual restaurant ID via user_branches table
 * @returns Menu categories with available items and restaurant branding information
 */
export const useCustomerMenuData = (urlParamId: string) => {
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the restaurant ID from user_branches table using the URL param (which is user ID)
      const { data: userBranchData, error: branchError } = await (supabase as any)
        .from('user_branches')
        .select('restaurant_id')
        .eq('user_id', urlParamId)
        .eq('is_default', true)
        .maybeSingle();

      if (branchError) {
        console.error('❌ Error fetching user restaurant:', branchError);
        throw branchError;
      }

      const actualRestaurantId = userBranchData?.restaurant_id;
      if (!actualRestaurantId) {
        throw new Error('Restaurant not found for this user');
      }

      console.log('✅ Found restaurant ID:', actualRestaurantId, 'for user:', urlParamId);

      // Fetch menu categories using the actual restaurant ID
      const { data: categoriesData, error: categoriesError } = await (supabase as any)
        .from('menu_categories')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('user_id', actualRestaurantId)
        .order('created_at', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Filter only available items and attach category_name for convenience in UI
      const filteredCategories: CustomerMenuCategory[] = (categoriesData?.map((category: any) => ({
        ...category,
        menu_items: (category.menu_items?.filter((item: any) => item.is_available) || []).map((item: any) => ({
          ...item,
          // Ensure optional fields exist to satisfy UI typings
          persuasion_description: item.persuasion_description ?? null,
          is_chef_special: item.is_chef_special ?? null,
          popularity_badge: item.popularity_badge ?? null,
          category_name: category.name,
        })) as CustomerMenuItem[],
      })) || []);

      setCategories(filteredCategories);

      // Fetch restaurant info from the restaurants table
      const { data: restaurantData, error: restaurantError } = await (supabase as any)
        .from('restaurants')
        .select('name, description, phone_number, logo_url, cover_image_url, primary_color, secondary_color, tagline')
        .eq('id', actualRestaurantId)
        .single();

      if (restaurantData) {
        setRestaurantInfo({
          id: actualRestaurantId,
          name: restaurantData.name || "MenuHub Restaurant",
          description: restaurantData.description || "Delicious meals made with love",
          logo_url: restaurantData.logo_url,
          cover_image_url: restaurantData.cover_image_url,
          tagline: restaurantData.tagline,
          primary_color: restaurantData.primary_color,
          secondary_color: restaurantData.secondary_color,
          phone_number: restaurantData.phone_number,
        });
      } else {
        setRestaurantInfo({
          id: actualRestaurantId,
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
    if (urlParamId) {
      fetchMenuData();
    }
  }, [urlParamId]);

  return {
    categories,
    restaurantInfo,
    loading,
    error,
    refetch: fetchMenuData,
  };
};
