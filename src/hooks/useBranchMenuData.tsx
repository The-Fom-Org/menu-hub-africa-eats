import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_chef_special?: boolean;
  persuasion_description?: string;
  popularity_badge?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  user_id: string; // This will be restaurant_id after migration
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  menu_items: MenuItem[];
}

export const useBranchMenuData = () => {
  const { selectedBranch } = useBranch();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMenuData = async () => {
    if (!selectedBranch?.restaurant_id) {
      setCategories([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .select(`
          *,
          menu_items (*)
        `)
        .eq("user_id", selectedBranch.restaurant_id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching menu data:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string, description?: string) => {
    if (!selectedBranch?.restaurant_id) return null;

    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .insert([
          {
            name,
            description,
            user_id: selectedBranch.restaurant_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchMenuData();
      return data;
    } catch (error) {
      console.error("Error adding category:", error);
      return null;
    }
  };

  const addMenuItem = async (
    categoryId: string,
    item: Omit<MenuItem, "id" | "created_at" | "updated_at" | "category_id">
  ) => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert([
          {
            ...item,
            category_id: categoryId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchMenuData();
      return data;
    } catch (error) {
      console.error("Error adding menu item:", error);
      return null;
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      await fetchMenuData();
      return data;
    } catch (error) {
      console.error("Error updating menu item:", error);
      return null;
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await fetchMenuData();
      return true;
    } catch (error) {
      console.error("Error deleting menu item:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [selectedBranch?.restaurant_id]);

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