'use client';

/**
 * Mockups schématiques des écrans Chrome utilisés dans le tutoriel
 * d'installation : interrupteur Mode développeur, dialogue de chargement
 * d'extension non empaquetée, et menu d'épinglage des extensions.
 *
 * Chrome interdit la capture de ses pages internes depuis tout outil
 * d'automatisation : ces SVG remplacent les vraies captures d'écran.
 */

const svgWrap = 'w-full h-auto rounded-md border bg-slate-50';

export function DevModeToggleIllustration(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 140"
      className={svgWrap}
      role="img"
      aria-label="Interrupteur Mode développeur activé en haut à droite"
    >
      <rect
        x="8"
        y="8"
        width="304"
        height="124"
        rx="8"
        fill="#fff"
        stroke="#e5e7eb"
        strokeWidth="1.5"
      />
      <text
        x="20"
        y="32"
        fontSize="13"
        fill="#111827"
        fontFamily="system-ui"
        fontWeight="600"
      >
        Extensions
      </text>
      <text x="200" y="32" fontSize="11" fill="#374151" fontFamily="system-ui">
        Mode développeur
      </text>
      <rect x="280" y="20" width="22" height="14" rx="7" fill="#3b82f6" />
      <circle cx="295" cy="27" r="5" fill="#fff" />
      <line x1="8" y1="48" x2="312" y2="48" stroke="#e5e7eb" />
      <rect
        x="16"
        y="62"
        width="150"
        height="32"
        rx="4"
        fill="#eff6ff"
        stroke="#3b82f6"
      />
      <text
        x="91"
        y="82"
        fontSize="10"
        fill="#1d4ed8"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        Charger non empaquetée
      </text>
      <rect
        x="174"
        y="62"
        width="70"
        height="32"
        rx="4"
        fill="#fff"
        stroke="#d1d5db"
      />
      <text
        x="209"
        y="82"
        fontSize="10"
        fill="#6b7280"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        Compresser…
      </text>
      <rect
        x="252"
        y="62"
        width="52"
        height="32"
        rx="4"
        fill="#fff"
        stroke="#d1d5db"
      />
      <text
        x="278"
        y="82"
        fontSize="9"
        fill="#6b7280"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        Mettre à jour
      </text>
      <path
        d="M 295 42 L 295 50 M 290 47 L 295 52 L 300 47"
        stroke="#3b82f6"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="295"
        y="118"
        fontSize="10"
        fill="#3b82f6"
        fontFamily="system-ui"
        textAnchor="end"
      >
        ← Activez cet interrupteur
      </text>
    </svg>
  );
}

export function LoadUnpackedIllustration(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 140"
      className={svgWrap}
      role="img"
      aria-label="Bouton Charger l'extension non empaquetée + sélection de dossier"
    >
      <rect x="14" y="22" width="170" height="36" rx="6" fill="#3b82f6" />
      <text
        x="99"
        y="45"
        fontSize="11"
        fill="#fff"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        Charger non empaquetée
      </text>
      <path
        d="M 190 40 L 218 40 M 211 33 L 218 40 L 211 47"
        stroke="#6b7280"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="222"
        y="20"
        width="86"
        height="100"
        rx="6"
        fill="#fff"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <text
        x="265"
        y="40"
        fontSize="9"
        fill="#374151"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        Choisir un dossier
      </text>
      <line x1="228" y1="48" x2="302" y2="48" stroke="#e5e7eb" />
      <path
        d="M 235 60 L 235 96 L 295 96 L 295 68 L 265 68 L 260 60 Z"
        fill="#fef3c7"
        stroke="#f59e0b"
      />
      <text
        x="265"
        y="84"
        fontSize="8"
        fill="#92400e"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        verone-src/
      </text>
      <text
        x="265"
        y="113"
        fontSize="9"
        fill="#10b981"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        ✓ Sélectionner
      </text>
    </svg>
  );
}

export function PinIconIllustration(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 140"
      className={svgWrap}
      role="img"
      aria-label="Épingler l'icône Verone via le menu puzzle de Chrome"
    >
      <rect
        x="8"
        y="8"
        width="304"
        height="36"
        rx="8"
        fill="#fff"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <text x="22" y="32" fontSize="11" fill="#6b7280" fontFamily="system-ui">
        Barre Chrome
      </text>
      <circle cx="240" cy="26" r="11" fill="#f3f4f6" stroke="#9ca3af" />
      <path
        d="M 234 22 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 z"
        fill="#6b7280"
      />
      <circle cx="266" cy="26" r="11" fill="#111827" />
      <text
        x="266"
        y="30"
        fontSize="11"
        fill="#fff"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="700"
      >
        V
      </text>
      <path
        d="M 266 41 L 266 50 M 261 46 L 266 51 L 271 46"
        stroke="#10b981"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="180"
        y="58"
        width="120"
        height="74"
        rx="6"
        fill="#fff"
        stroke="#d1d5db"
      />
      <text
        x="240"
        y="74"
        fontSize="10"
        fill="#374151"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        Extensions épinglées
      </text>
      <line x1="186" y1="80" x2="294" y2="80" stroke="#e5e7eb" />
      <circle cx="198" cy="98" r="9" fill="#111827" />
      <text
        x="198"
        y="102"
        fontSize="10"
        fill="#fff"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="700"
      >
        V
      </text>
      <text x="215" y="102" fontSize="10" fill="#111827" fontFamily="system-ui">
        Verone Sourcing
      </text>
      <text
        x="240"
        y="125"
        fontSize="9"
        fill="#10b981"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        Cliquez sur l&apos;épingle pour fixer
      </text>
    </svg>
  );
}
