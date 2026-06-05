"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Délai d'apparition (s) — pratique pour un effet cascade. */
  delay?: number;
  /** Décalage vertical initial (px). */
  y?: number;
};

/** Apparition en fondu + glissé, déclenchée à l'affichage. */
export default function Reveal({ children, className, delay = 0, y = 16 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
