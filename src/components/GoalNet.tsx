/**
 * Cage de but décorative (montants + filet) en SVG. La couleur vient de
 * `currentColor` (réglée via une classe `text-*`). Utilisée en décor sur le
 * login, de part et d'autre du formulaire.
 */
export default function GoalNet({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 220"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <pattern
          id="goalnet"
          width="11"
          height="11"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 5.5 H11 M5.5 0 V11" stroke="currentColor" strokeWidth="0.6" />
        </pattern>
      </defs>
      {/* filet */}
      <rect x="10" y="14" width="100" height="192" fill="url(#goalnet)" opacity="0.55" />
      {/* cadre : montant gauche, barre transversale, montant droit */}
      <path
        d="M10 206 V14 H110 V206"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
