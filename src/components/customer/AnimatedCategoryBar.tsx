
import { motion, AnimatePresence } from 'framer-motion';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getCategoryEmoji } from './CategoryEmojis';
import { GLOBAL_EASE } from '@/lib/motion-variants';

interface Category {
  id: string;
  name: string;
  menu_items?: any[];
}

interface AnimatedCategoryBarProps {
  categories: Category[];
  searchTerm: string;
  showChefSpecials: boolean;
  activeTab?: string;
}

export const AnimatedCategoryBar = ({ 
  categories, 
  searchTerm, 
  showChefSpecials,
  activeTab 
}: AnimatedCategoryBarProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: GLOBAL_EASE }}
      className="sticky top-16 sm:top-20 z-40 py-2 sm:py-4 -mx-2 sm:-mx-4 px-2 sm:px-4 border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 backdrop-blur-sm p-1 h-auto relative">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: GLOBAL_EASE,
              delay: index * 0.05
            }}
            className="relative"
          >
            <TabsTrigger 
              value={category.id}
              className="whitespace-nowrap flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm relative overflow-hidden"
            >
              <span className="text-sm sm:text-lg">{getCategoryEmoji(category.name)}</span>
              <span className="font-medium">{category.name}</span>
              {(searchTerm || showChefSpecials) && category.menu_items && category.menu_items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {category.menu_items.length}
                  </Badge>
                </motion.div>
              )}
              
              {/* Animated ink underline */}
              <AnimatePresence>
                {activeTab === category.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: GLOBAL_EASE,
                      layout: { duration: 0.2 }
                    }}
                  />
                )}
              </AnimatePresence>
            </TabsTrigger>
          </motion.div>
        ))}
      </TabsList>
    </motion.div>
  );
};
