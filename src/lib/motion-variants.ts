
// Global motion constants and variants
export const GLOBAL_EASE = [0.22, 1, 0.36, 1] as const;
export const VIEWPORT_TRIGGER = { once: true, amount: 0.3 };
export const STAGGER_DELAY = 0.06; // 60ms

// Accessibility check
export const getReducedMotionVariants = (variants: any) => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Fallback to simple fade for reduced motion
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } }
    };
  }
  return variants;
};

// Hero/Header variants
export const heroVariants = getReducedMotionVariants({
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: GLOBAL_EASE 
    }
  }
});

// Section header variants
export const sectionHeaderVariants = getReducedMotionVariants({
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.45, 
      ease: GLOBAL_EASE 
    }
  }
});

// Menu item container variants
export const menuContainerVariants = getReducedMotionVariants({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: GLOBAL_EASE,
      staggerChildren: STAGGER_DELAY
    }
  }
});

// Menu item variants
export const menuItemVariants = getReducedMotionVariants({
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: GLOBAL_EASE 
    }
  }
});

// Price chip variants (slide from right with spring)
export const priceChipVariants = getReducedMotionVariants({
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring",
      stiffness: 380,
      damping: 28,
      delay: 0.08
    }
  }
});

// Image reveal variants
export const imageVariants = getReducedMotionVariants({
  hidden: { opacity: 0, scale: 0.985 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: GLOBAL_EASE 
    }
  }
});

// Ken Burns effect for images
export const kenBurnsVariants = getReducedMotionVariants({
  initial: { scale: 1 },
  animate: { 
    scale: 1.03,
    transition: { 
      duration: 8, 
      ease: "linear",
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
});

// Cart badge bounce
export const cartBadgeBounce = {
  scale: [0.9, 1.12, 1],
  transition: { 
    duration: 0.4, 
    ease: GLOBAL_EASE 
  }
};

// Sticky cart bar variants
export const cartBarVariants = getReducedMotionVariants({
  hidden: { opacity: 0, y: 96 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
});

// Divider grow animation
export const dividerVariants = getReducedMotionVariants({
  hidden: { scaleX: 0 },
  visible: { 
    scaleX: 1,
    transition: { 
      duration: 0.6, 
      ease: GLOBAL_EASE,
      delay: 0.2
    }
  }
});
