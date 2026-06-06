"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const DISMISS_KEY = "ios-install-dismissed";

// Bandeau « ajoute à l'écran d'accueil » — uniquement sur iPhone/iPad dans
// Safari et hors mode installé (sur iOS, les notifications push n'existent
// que pour une PWA ajoutée à l'écran d'accueil).
export default function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let alive = true;
    const detect = async (): Promise<boolean> => {
      if (localStorage.getItem(DISMISS_KEY)) return false;
      const ua = navigator.userAgent || "";
      const isIos =
        /iphone|ipad|ipod/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      // Ajout à l'écran d'accueil = Safari uniquement (pas Chrome/Firefox iOS).
      const isSafari = !/crios|fxios|edgios/i.test(ua);
      const nav = navigator as Navigator & { standalone?: boolean };
      const standalone =
        nav.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
      return isIos && isSafari && !standalone;
    };
    detect().then((v) => {
      if (alive && v) setShow(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-400/10 to-transparent p-4"
        >
          <span className="text-2xl leading-none">📲</span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">Installe l&apos;app sur ton iPhone</p>
            <p className="mt-0.5 text-slate-400">
              Appuie sur <span className="font-semibold text-sky-300">Partager ⬆️</span>{" "}
              puis <span className="font-semibold text-sky-300">« Sur l&apos;écran d&apos;accueil »</span>
              {" "}— nécessaire pour recevoir les notifications.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Ignorer"
            className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
