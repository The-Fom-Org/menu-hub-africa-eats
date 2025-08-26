
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { heroVariants } from '@/lib/motion-variants';

interface AnimatedHeroSectionProps {
  restaurantName: string;
  coverImageUrl?: string;
  onScrollToMenu: () => void;
}

export const AnimatedHeroSection = ({ 
  restaurantName, 
  coverImageUrl, 
  onScrollToMenu 
}: AnimatedHeroSectionProps) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  // Parallax effect - image moves slower than scroll (0.85x speed)
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  
  // Check for reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.section 
      ref={containerRef}
      className="relative h-64 sm:h-80 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        style={{ y: prefersReducedMotion ? 0 : y }}
      >
        {coverImageUrl ? (
          <img 
            src={coverImageUrl} 
            alt={restaurantName}
            className="w-full h-full object-cover"
            style={{ willChange: 'transform' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <motion.div 
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="text-center text-white px-4"
        >
          <motion.h1 
            className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-lg"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.6, 
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.1
                }
              }
            }}
          >
            Welcome to {restaurantName}
          </motion.h1>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.5, 
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.3
                }
              }
            }}
          >
            <Button 
              onClick={onScrollToMenu}
              size="lg"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-300"
            >
              Explore Menu
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};
