"use client";

import { motion } from "motion/react";

/** Barre de points qui se remplit à l'affichage. */
export default function AnimatedBar({
  width,
  delay = 0,
}: {
  width: number;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute inset-y-0 left-0 -z-0 bg-gradient-to-r from-emerald-500/15 to-transparent"
      initial={{ width: 0 }}
      animate={{ width: `${width}%` }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    />
  );
}
