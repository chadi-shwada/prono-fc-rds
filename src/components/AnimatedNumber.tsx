"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";

/** Affiche un nombre qui défile de 0 jusqu'à `value`. */
export default function AnimatedNumber({
  value,
  duration = 1,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{display}</>;
}
