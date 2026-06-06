"use client";

import { motion } from "motion/react";

// Carte « comment ça marche » : apparaît au défilement, se soulève au survol et
// l'icône fait un petit clin d'œil (rotation + zoom) — tout via motion pour
// éviter les conflits de transform avec les classes CSS.
export default function FeatureCard({
  icon,
  title,
  text,
  delay = 0,
}: {
  icon: string;
  title: string;
  text: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      whileHover="hover"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: 26 },
        show: { opacity: 1, y: 0 },
        hover: { y: -6 },
      }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass h-full rounded-2xl p-5"
    >
      <motion.div
        variants={{ hover: { rotate: [0, -14, 14, -6, 0], scale: 1.18 } }}
        transition={{ duration: 0.6 }}
        className="text-4xl"
      >
        {icon}
      </motion.div>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
    </motion.div>
  );
}
