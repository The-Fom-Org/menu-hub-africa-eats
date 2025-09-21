
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

export const useCustomerMenuData = (restaurantId: string) => {
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [CustomerMenuData] Fetching data for restaurant:', restaurantId);

      // Fetch menu categories with items
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('user_id', restaurantId)
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

      // Fetch restaurant info from restaurants table
      console.log('🏪 [CustomerMenuData] Fetching restaurant info for ID:', restaurantId);
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name, description, logo_url, cover_image_url, primary_color, secondary_color, phone_number, tagline')
        .eq('id', restaurantId)
        .single();

      console.log('🏪 [CustomerMenuData] Restaurant data:', restaurantData, 'Error:', restaurantError);

      if (restaurantData) {
        const info = {
          id: restaurantId,
          name: restaurantData.name || "MenuHub Restaurant",
          description: restaurantData.description || "Delicious meals made with love",
          logo_url: restaurantData.logo_url,
          cover_image_url: restaurantData.cover_image_url,
          tagline: restaurantData.tagline,
          primary_color: restaurantData.primary_color,
          secondary_color: restaurantData.secondary_color,
          phone_number: restaurantData.phone_number,
        };
        console.log('✅ [CustomerMenuData] Setting restaurant info:', info);
        setRestaurantInfo(info);
      } else {
        console.log('⚠️ [CustomerMenuData] No restaurant data found, trying profiles fallback');
        // Fallback: Try profiles table for backward compatibility
        const { data: profileData } = await supabase
          .from('profiles')
          .select('restaurant_name, logo_url, cover_image_url, primary_color, secondary_color')
          .eq('user_id', restaurantId)
          .single();

        if (profileData) {
          const fallbackInfo = {
            id: restaurantId,
            name: profileData.restaurant_name || "MenuHub Restaurant",
            description: "Delicious meals made with love",
            logo_url: profileData.logo_url,
            cover_image_url: profileData.cover_image_url,
            primary_color: profileData.primary_color,
            secondary_color: profileData.secondary_color,
          };
          console.log('✅ [CustomerMenuData] Setting fallback restaurant info:', fallbackInfo);
          setRestaurantInfo(fallbackInfo);
        } else {
          console.log('❌ [CustomerMenuData] No restaurant or profile data found, using default');
          setRestaurantInfo({
            id: restaurantId,
            name: "MenuHub Restaurant",
            description: "Delicious meals made with love",
            logo_url: undefined,
            cover_image_url: undefined,
          });
        }
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
