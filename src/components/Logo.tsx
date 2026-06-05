/**
 * Logo de la marque — identique à l'icône du navigateur (src/app/icon.svg) :
 * trophée doré + « 26 » sur fond sombre arrondi. Inline pour rester net à toute
 * taille et éviter une requête supplémentaire.
 */
export default function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="#0a0e17" />
      {/* Trophée doré, en haut */}
      <g transform="translate(256,128) scale(0.42) translate(-256,-256)">
        <path
          d="M168 150 C108 150 108 244 178 252"
          fill="none"
          stroke="url(#logo-gold)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M344 150 C404 150 404 244 334 252"
          fill="none"
          stroke="url(#logo-gold)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M158 130 H354 V198 C354 270 314 314 256 314 C198 314 158 270 158 198 Z"
          fill="url(#logo-gold)"
        />
        <rect x="238" y="312" width="36" height="50" fill="url(#logo-gold)" />
        <rect x="196" y="358" width="120" height="22" rx="8" fill="url(#logo-gold)" />
        <rect x="170" y="382" width="172" height="32" rx="13" fill="url(#logo-gold)" />
      </g>
      {/* "26" */}
      <text
        x="256"
        y="392"
        textAnchor="middle"
        fontFamily="'Arial Black','Arial',sans-serif"
        fontWeight="900"
        fontSize="250"
        fill="#ffffff"
        letterSpacing="-6"
      >
        26
      </text>
    </svg>
  );
}
