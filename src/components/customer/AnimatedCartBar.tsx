
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { CartDrawer } from './CartDrawer';
import { cartBarVariants, cartBadgeBounce } from '@/lib/motion-variants';
import { useEffect, useState } from 'react';

interface AnimatedCartBarProps {
  restaurantId: string;
}

export const AnimatedCartBar = ({ restaurantId }: AnimatedCartBarProps) => {
  const { getCartCount, getCartTotal } = useCart(restaurantId);
  const [previousCount, setPreviousCount] = useState(0);
  const [shouldBounce, setShouldBounce] = useState(false);
  
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  // Trigger bounce animation when cart count increases
  useEffect(() => {
    if (cartCount > previousCount && previousCount > 0) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 400);
      return () => clearTimeout(timer);
    }
    setPreviousCount(cartCount);
  }, [cartCount, previousCount]);

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div
          variants={cartBarVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t shadow-lg"
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  animate={shouldBounce ? cartBadgeBounce : {}}
                  className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold"
                >
                  {cartCount} item{cartCount !== 1 ? 's' : ''}
                </motion.div>
                <motion.div
                  key={cartTotal}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="text-lg font-bold"
                >
                  KSh {cartTotal.toFixed(2)}
                </motion.div>
              </div>
              <CartDrawer restaurantId={restaurantId} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
