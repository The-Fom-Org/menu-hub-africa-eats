
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryEmoji } from './CategoryEmojis';
import { MenuItemCard } from './MenuItemCard';
import { 
  sectionHeaderVariants, 
  menuContainerVariants, 
  dividerVariants,
  VIEWPORT_TRIGGER 
} from '@/lib/motion-variants';

interface MenuSectionProps {
  category: {
    id: string;
    name: string;
    description?: string;
    menu_items?: any[];
  };
  restaurantId: string;
  searchTerm?: string;
  showChefSpecials?: boolean;
}

export const AnimatedMenuSection = ({ 
  category, 
  restaurantId, 
  searchTerm, 
  showChefSpecials 
}: MenuSectionProps) => {
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const isHeaderInView = useInView(headerRef, VIEWPORT_TRIGGER);
  const isContentInView = useInView(contentRef, VIEWPORT_TRIGGER);

  return (
    <div id={`category-${category.id}`} className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <motion.div
        ref={headerRef}
        variants={sectionHeaderVariants}
        initial="hidden"
        animate={isHeaderInView ? "visible" : "hidden"}
      >
        <Card className="bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <CardHeader className="text-center py-4 sm:py-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
              <span className="text-2xl sm:text-3xl">{getCategoryEmoji(category.name)}</span>
              <CardTitle className="text-lg sm:text-2xl relative">
                {category.name}
                {/* Auto-growing divider */}
                <motion.div
                  variants={dividerVariants}
                  initial="hidden"
                  animate={isHeaderInView ? "visible" : "hidden"}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-px bg-primary/30 w-16 origin-center"
                />
              </CardTitle>
            </div>
            {category.description && (
              <p className="text-sm sm:text-base text-muted-foreground">{category.description}</p>
            )}
            {(searchTerm || showChefSpecials) && category.menu_items && category.menu_items.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {showChefSpecials 
                  ? `${category.menu_items.length} chef's special item${category.menu_items.length !== 1 ? 's' : ''}`
                  : `Found ${category.menu_items.length} item${category.menu_items.length !== 1 ? 's' : ''} matching "${searchTerm}"`
                }
              </p>
            )}
          </CardHeader>
        </Card>
      </motion.div>

      {/* Menu Items Grid */}
      <motion.div
        ref={contentRef}
        variants={menuContainerVariants}
        initial="hidden"
        animate={isContentInView ? "visible" : "hidden"}
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {category.menu_items && category.menu_items.length > 0 ? (
          category.menu_items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { 
                    duration: 0.5, 
                    ease: [0.22, 1, 0.36, 1],
                    delay: index * 0.06
                  }
                }
              }}
              whileHover={{ 
                y: -4, 
                transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
              }}
              style={{ willChange: 'transform' }}
            >
              <MenuItemCard
                item={item}
                restaurantId={restaurantId}
              />
            </motion.div>
          ))
        ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
            }}
            className="col-span-full"
          >
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="py-6 sm:py-8 text-center">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {showChefSpecials 
                    ? "No chef's special items available at the moment."
                    : (searchTerm ? `No items found matching "${searchTerm}" in this category.` : 'No items in this category yet.')
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
