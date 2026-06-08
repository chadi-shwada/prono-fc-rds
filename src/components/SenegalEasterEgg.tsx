"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import Flag from "@/components/Flag";
import { claimEasterEggAction } from "@/app/actions/easterEgg";

const SECRET = "senegal";
const SN_COLORS = ["#00853F", "#FDEF42", "#E31B23"]; // vert, jaune, rouge

// Easter egg : taper « senegal » au clavier déclenche une vanne amicale 🦁
export default function SenegalEasterEgg() {
  const [open, setOpen] = useState(false);
  const [bonus, setBonus] = useState<number | null>(null);
  const buffer = useRef("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireConfetti = useCallback(() => {
    const shots = [
      { spread: 26, startVelocity: 55 },
      { spread: 60 },
      { spread: 100, decay: 0.91, scalar: 0.9 },
      { spread: 120, startVelocity: 40 },
    ];
    shots.forEach((o, i) =>
      confetti({
        particleCount: 60,
        origin: { y: 0.6 },
        colors: SN_COLORS,
        ...o,
        ...(i % 2 ? { angle: 60 } : { angle: 120 }),
      }),
    );
  }, []);

  const trigger = useCallback(() => {
    setOpen(true);
    setBonus(null);
    fireConfetti();
    // Crédite le bonus (une seule fois par joueur) et affiche « +5 » si gagné.
    claimEasterEggAction()
      .then((r) => {
        if (r.awarded) setBonus(r.points);
      })
      .catch(() => {});
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 7000);
  }, [fireConfetti]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      const c = e.key.toLowerCase().replace(/[éèê]/g, "e");
      if (!/[a-z]/.test(c)) return;
      buffer.current = (buffer.current + c).slice(-SECRET.length);
      if (buffer.current === SECRET) {
        buffer.current = "";
        trigger();
      }
    };
    // Déclencheur tactile (mobile) : tout élément peut émettre cet évènement.
    const onCustom = () => trigger();
    window.addEventListener("keydown", onKey);
    window.addEventListener("prono:senegal", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("prono:senegal", onCustom);
    };
  }, [trigger]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.7, y: 30, rotate: -3 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900 p-7 text-center shadow-2xl"
          >
            {/* bandeau aux couleurs du Sénégal */}
            <div className="absolute inset-x-0 top-0 flex h-1.5">
              <div className="flex-1" style={{ background: SN_COLORS[0] }} />
              <div className="flex-1" style={{ background: SN_COLORS[1] }} />
              <div className="flex-1" style={{ background: SN_COLORS[2] }} />
            </div>

            <motion.div
              animate={{ rotate: [0, -12, 12, -8, 8, 0], y: [0, -8, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.4 }}
              className="text-7xl"
            >
              🦁
            </motion.div>

            <div className="mt-2 flex items-center justify-center gap-2">
              <Flag code="SEN" size={30} />
              <h2 className="font-display text-2xl font-extrabold text-white">
                Eh Moussa ! 🦁
              </h2>
            </div>

            <p className="mt-3 text-base font-semibold leading-relaxed text-slate-200">
              Rends-nous la coupe et arrête de faire le rageux 😤
            </p>

            <p className="mt-3 font-display text-3xl font-extrabold text-red-400">
              VA CHIER !!
            </p>

            {bonus !== null && (
              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 16 }}
                className="mt-4 inline-block rounded-full bg-amber-400/20 px-4 py-1.5 font-display text-sm font-extrabold text-amber-300"
              >
                🎁 +{bonus} points pour la découverte !
              </motion.p>
            )}

            <p className="mt-4 text-[11px] text-slate-400">(clique pour fermer)</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
