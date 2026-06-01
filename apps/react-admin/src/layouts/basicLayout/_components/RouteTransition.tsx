import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import type { ReactNode, CSSProperties } from "react";

interface RouteTransitionProps {
  children: ReactNode;
  style?: CSSProperties;
}

const RouteTransition = ({ children, style }: RouteTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        style={{
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default RouteTransition;
