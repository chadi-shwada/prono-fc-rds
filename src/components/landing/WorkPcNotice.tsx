"use client";

import { useEffect, useState } from "react";

// Rendu visible côté serveur, puis MASQUÉ dès que le JavaScript s'exécute.
// Conséquence : il ne reste affiché que lorsque le JS est bloqué (réseau de
// l'entreprise qui filtre /_next/static) — précisément le cas où l'app ne peut
// pas fonctionner. Sur mobile / réseau normal, il disparaît à l'hydratation.
export default function WorkPcNotice() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setHidden(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (hidden) return null;

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center text-sm text-amber-100">
      📱 <strong>Ouvre Prono FC RDS depuis ton téléphone</strong>{" "}
      pour jouer. Sur les PC du réseau de l&apos;entreprise, l&apos;application ne
      peut pas se charger.
    </div>
  );
}
