"use client";

import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent } from "react";
import Logo from "@/components/Logo";
import AnimatedNumber from "@/components/AnimatedNumber";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Apparition « qui monte », déclinable en cascade via `delay`.
function rise(delay: number) {
  return {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  };
}

export default function LandingHero() {
  // Lueur emerald qui suit le curseur (parallax léger), lissée par un ressort.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.35);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const px = useTransform(sx, (v) => `${v * 100}%`);
  const py = useTransform(sy, (v) => `${v * 100}%`);
  const glow = useMotionTemplate`radial-gradient(480px circle at ${px} ${py}, rgba(16,185,129,0.16), transparent 60%)`;

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <section
      onPointerMove={onMove}
      className="relative isolate flex flex-col items-center gap-5 pt-12 text-center sm:pt-16"
    >
      <motion.div
        aria-hidden
        style={{ background: glow }}
        className="pointer-events-none absolute inset-0 -z-10"
      />
      <motion.span
        {...rise(0.05)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300"
      >
        ⚽ Coupe du Monde 2026 · entre collègues RATP
      </motion.span>

      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -14 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 13, delay: 0.1 }}
      >
        <div className="float drop-shadow-[0_0_34px_rgba(16,185,129,0.5)]">
          <Logo size={94} className="rounded-[22px]" />
        </div>
      </motion.div>

      <motion.h1
        {...rise(0.22)}
        className="font-display text-5xl font-extrabold leading-[1.05] sm:text-7xl"
      >
        Prono FC <span className="text-gradient">RDS</span>
      </motion.h1>

      <motion.p
        {...rise(0.32)}
        className="max-w-xl text-balance text-lg text-slate-300"
      >
        Le pronostic maison de la Coupe du Monde 2026. Devine les scores, grimpe
        au classement et chambre tes collègues — du match d&apos;ouverture à la
        finale.
      </motion.p>

      <motion.div
        {...rise(0.42)}
        className="flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/login"
          className="pulse-glow shimmer rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-3.5 font-display text-lg font-bold text-emerald-950 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
        >
          Entrer dans le jeu ⚽
        </Link>
        <span className="text-xs text-slate-400">🔒 Accès sur invitation</span>
      </motion.div>

      <motion.div
        {...rise(0.52)}
        className="mt-2 flex items-center gap-3 text-sm text-slate-400 sm:gap-5"
      >
        <Stat n={48} label="équipes" />
        <span className="text-slate-700">•</span>
        <Stat n={104} label="matchs" />
        <span className="text-slate-700">•</span>
        <Stat n={1} label="champion" />
      </motion.div>

      <motion.div {...rise(0.7)} className="mt-2" aria-hidden>
        <span className="scroll-cue inline-block text-2xl text-slate-500">⌄</span>
      </motion.div>
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="scoreboard font-display text-xl font-extrabold text-emerald-400">
        <AnimatedNumber value={n} />
      </span>
      {label}
    </span>
  );
}
