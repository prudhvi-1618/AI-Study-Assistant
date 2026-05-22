import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Common animation variants for Framer Motion components
 * Used with motion.div, motion.section, etc.
 */
export const animationVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  fadeInUp: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  fadeInDown: {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  fadeInLeft: {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  fadeInRight: {
    hidden: { x: 20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  scaleIn: {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  },
  buttonHover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  buttonTap: {
    scale: 0.97,
  },
};

/**
 * Hook to handle scroll-triggered animations using GSAP
 * Usage: useScrollAnimation('[data-animate]', 'fadeInUp', 0.3);
 */
export function useScrollAnimation(
  selector: string,
  animationClass: string,
  delay = 0
) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);

    elements.forEach((element, index) => {
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          once: true,
        },
        className: `+= ${animationClass}`,
        delay: index * (delay / 1000),
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [selector, animationClass, delay]);
}

/**
 * Hook for parallax scroll effects
 * Usage: useParallax('[data-parallax]', 0.5);
 */
export function useParallax(selector: string, speed = 0.5) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);

    elements.forEach((element) => {
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          start: 'top center',
          scrub: 1,
          markers: false,
        },
        y: window.innerHeight * speed,
        ease: 'none',
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [selector, speed]);
}

/**
 * Hook for timeline animations (multiple steps)
 * Usage: useTimeline();
 */
export function useTimeline() {
  const createTimeline = () => {
    return gsap.timeline();
  };

  return { createTimeline };
}

/**
 * Stagger animation helper
 * Returns delay in seconds for nth item in stagger sequence
 * Usage: style={{ animationDelay: `${getStaggerDelay(index)}s` }}
 */
export function getStaggerDelay(
  index: number,
  baseDelay = 0,
  stepDelay = 0.05
): number {
  return baseDelay + index * stepDelay;
}

/**
 * Common motion transitions for Framer Motion
 */
export const transitions = {
  smooth: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
  fast: {
    duration: 0.2,
    ease: 'easeOut',
  },
  normal: {
    duration: 0.3,
    ease: 'easeOut',
  },
  slow: {
    duration: 0.5,
    ease: 'easeOut',
  },
};
