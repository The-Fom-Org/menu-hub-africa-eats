import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  category_id: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  menu_items?: MenuItem[];
}

export const useMenuData = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMenuData = async () => {
    if (!user) return;

    try {
      // Get restaurant ID from user_branches
      const { data: branchData } = await supabase
        .from('user_branches')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      const targetId = branchData?.restaurant_id || user.id;
      setRestaurantId(targetId);

      const { data: categoriesData, error } = await (supabase as any)
        .from('menu_categories')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('user_id', targetId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [user]);

  const addCategory = async (name: string, description: string = '') => {
    if (!user || !restaurantId) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('menu_categories')
        .insert({
          name,
          description,
          user_id: restaurantId,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMenuData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      return null;
    }
  };

  const addMenuItem = async (categoryId: string, item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'category_id'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('menu_items')
        .insert({
          ...item,
          category_id: categoryId,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMenuData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      return null;
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('menu_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      await fetchMenuData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return null;
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchMenuData(); // Refresh data
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  };

  return {
    categories,
    loading,
    addCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refetch: fetchMenuData,
  };
};