
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

      console.log('🔍 Fetching menu data for URL param:', urlParamId);

      // Try to get restaurant ID from user_branches first (new model)
      const { data: userBranchData, error: branchError } = await (supabase as any)
        .from('user_branches')
        .select('restaurant_id')
        .eq('user_id', urlParamId)
        .eq('is_default', true)
        .maybeSingle();

      let actualRestaurantId = userBranchData?.restaurant_id;
      let useNewModel = !!actualRestaurantId;

      if (!actualRestaurantId) {
        console.log('⚠️ No restaurant found in user_branches, using legacy model');
        // Fallback to legacy model - use user ID directly
        actualRestaurantId = urlParamId;
        useNewModel = false;
      }

      console.log('✅ Using restaurant ID:', actualRestaurantId, 'New model:', useNewModel);

      // Fetch menu categories - try restaurant ID first, fallback to user ID
      let categoriesData = null;
      let categoriesError = null;

      if (useNewModel) {
        const result = await (supabase as any)
          .from('menu_categories')
          .select(`
            *,
            menu_items (*)
          `)
          .eq('user_id', actualRestaurantId)
          .order('created_at', { ascending: true });

        categoriesData = result.data;
        categoriesError = result.error;

        // If no data found with restaurant ID, try user ID (legacy)
        if (!categoriesError && (!categoriesData || categoriesData.length === 0)) {
          console.log('📦 No categories found with restaurant ID, trying user ID');
          const fallbackResult = await (supabase as any)
            .from('menu_categories')
            .select(`
              *,
              menu_items (*)
            `)
            .eq('user_id', urlParamId)
            .order('created_at', { ascending: true });
          
          categoriesData = fallbackResult.data;
          categoriesError = fallbackResult.error;
        }
      } else {
        // Use user ID directly (legacy model)
        const result = await (supabase as any)
          .from('menu_categories')
          .select(`
            *,
            menu_items (*)
          `)
          .eq('user_id', urlParamId)
          .order('created_at', { ascending: true });

        categoriesData = result.data;
        categoriesError = result.error;
      }

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

      // Fetch restaurant info
      if (useNewModel && actualRestaurantId) {
        // Try new restaurants table first
        const { data: restaurantData, error: restaurantError } = await (supabase as any)
          .from('restaurants')
          .select('name, description, phone_number, logo_url, cover_image_url, primary_color, secondary_color, tagline')
          .eq('id', actualRestaurantId)
          .maybeSingle();

        if (restaurantData && !restaurantError) {
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
          // Fallback to profiles table
          console.log('⚠️ Restaurant data not found in restaurants table, trying profiles');
          const { data: profileData } = await (supabase as any)
            .from('profiles')
            .select('restaurant_name, logo_url, cover_image_url, primary_color, secondary_color, description, phone_number, tagline')
            .eq('user_id', urlParamId)
            .maybeSingle();

          if (profileData) {
            setRestaurantInfo({
              id: actualRestaurantId,
              name: profileData.restaurant_name || "MenuHub Restaurant",
              description: profileData.description || "Delicious meals made with love",
              logo_url: profileData.logo_url,
              cover_image_url: profileData.cover_image_url,
              tagline: profileData.tagline,
              primary_color: profileData.primary_color,
              secondary_color: profileData.secondary_color,
              phone_number: profileData.phone_number,
            });
          } else {
            setRestaurantInfo({
              id: actualRestaurantId,
              name: "MenuHub Restaurant",
              description: "Delicious meals made with love",
            });
          }
        }
      } else {
        // Legacy model - use profiles table
        const { data: profileData } = await (supabase as any)
          .from('profiles')
          .select('restaurant_name, logo_url, cover_image_url, primary_color, secondary_color, description, phone_number, tagline')
          .eq('user_id', urlParamId)
          .maybeSingle();

        if (profileData) {
          setRestaurantInfo({
            id: urlParamId,
            name: profileData.restaurant_name || "MenuHub Restaurant",
            description: profileData.description || "Delicious meals made with love",
            logo_url: profileData.logo_url,
            cover_image_url: profileData.cover_image_url,
            tagline: profileData.tagline,
            primary_color: profileData.primary_color,
            secondary_color: profileData.secondary_color,
            phone_number: profileData.phone_number,
          });
        } else {
          setRestaurantInfo({
            id: urlParamId,
            name: "MenuHub Restaurant",
            description: "Delicious meals made with love",
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
