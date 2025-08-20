
-- Add new columns to menu_items table for persuasion features
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS persuasion_description text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_chef_special boolean DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS popularity_badge text;

-- Add category_name to menu_categories for easier querying
-- This might already exist, so we'll use IF NOT EXISTS
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS category_name text;

-- Update menu_categories to have category_name same as name if it doesn't exist
UPDATE menu_categories SET category_name = name WHERE category_name IS NULL;
