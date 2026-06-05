"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Révèle un score avec un retournement 3D (matchs terminés). */
export default function ScoreReveal({ children }: { children: ReactNode }) {
  return (
    <motion.span
      initial={{ rotateX: 90, opacity: 0 }}
      whileInView={{ rotateX: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "inline-block", transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.span>
  );
}
