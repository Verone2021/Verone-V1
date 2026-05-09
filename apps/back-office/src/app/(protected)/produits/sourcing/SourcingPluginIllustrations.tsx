'use client';

/**
 * Illustrations SVG schématiques pour le tutoriel d'installation du plugin
 * Chrome (onglet Plugin navigateur de /produits/sourcing).
 *
 * Pourquoi des SVG schématiques plutôt que de vrais screenshots :
 * Chrome interdit la capture de ses pages internes (chrome://extensions/)
 * depuis tout outil d'automatisation. Ces mockups sont plus lisibles, plus
 * légers, et restent justes même si Chrome change son design.
 */

const svgWrap = 'w-full h-auto rounded-md border bg-slate-50';

export function DownloadIllustration(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 140"
      className={svgWrap}
      role="img"
      aria-label="Fichier ZIP téléchargé dans le dossier Téléchargements"
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
      <text x="20" y="28" fontSize="11" fill="#6b7280" fontFamily="system-ui">
        Téléchargements
      </text>
      <line x1="8" y1="38" x2="312" y2="38" stroke="#e5e7eb" />
      <rect
        x="20"
        y="52"
        width="280"
        height="60"
        rx="6"
        fill="#eff6ff"
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      <rect x="32" y="68" width="28" height="28" rx="4" fill="#3b82f6" />
      <text
        x="46"
        y="86"
        fontSize="10"
        fill="#fff"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        ZIP
      </text>
      <text
        x="72"
        y="80"
        fontSize="12"
        fill="#111827"
        fontFamily="system-ui"
        fontWeight="600"
      >
        verone-sourcing-extension.zip
      </text>
      <text x="72" y="96" fontSize="10" fill="#6b7280" fontFamily="system-ui">
        19 Ko · à l&apos;instant
      </text>
    </svg>
  );
}

export function UnzipIllustration(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 140"
      className={svgWrap}
      role="img"
      aria-label="Archive ZIP extraite vers un dossier"
    >
      <rect
        x="20"
        y="35"
        width="80"
        height="70"
        rx="6"
        fill="#f3f4f6"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <rect x="32" y="50" width="56" height="8" rx="1" fill="#9ca3af" />
      <text
        x="60"
        y="80"
        fontSize="11"
        fill="#374151"
        fontFamily="system-ui"
        textAnchor="middle"
        fontWeight="600"
      >
        .zip
      </text>
      <path
        d="M 110 70 L 160 70 M 152 62 L 160 70 L 152 78"
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 175 50 L 175 105 L 300 105 L 300 60 L 215 60 L 205 50 Z"
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      <rect
        x="190"
        y="72"
        width="40"
        height="6"
        rx="1"
        fill="#fff"
        stroke="#d97706"
      />
      <rect
        x="190"
        y="84"
        width="55"
        height="6"
        rx="1"
        fill="#fff"
        stroke="#d97706"
      />
      <rect
        x="190"
        y="96"
        width="30"
        height="6"
        rx="1"
        fill="#fff"
        stroke="#d97706"
      />
      <text
        x="237"
        y="125"
        fontSize="10"
        fill="#92400e"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        verone-sourcing-extension/
      </text>
    </svg>
  );
}

export function ChromeUrlBarIllustration(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 140"
      className={svgWrap}
      role="img"
      aria-label="Barre d'adresse Chrome avec chrome://extensions/"
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
      <circle cx="22" cy="26" r="5" fill="#ef4444" />
      <circle cx="38" cy="26" r="5" fill="#f59e0b" />
      <circle cx="54" cy="26" r="5" fill="#10b981" />
      <line x1="8" y1="44" x2="312" y2="44" stroke="#e5e7eb" />
      <path
        d="M 22 64 L 30 56 L 38 64 M 30 56 L 30 80"
        stroke="#6b7280"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 50 60 L 58 68 L 50 76 M 58 68 L 42 68"
        stroke="#6b7280"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="72"
        y="56"
        width="226"
        height="26"
        rx="13"
        fill="#f3f4f6"
        stroke="#d1d5db"
      />
      <text
        x="86"
        y="73"
        fontSize="12"
        fill="#1f2937"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontWeight="600"
      >
        chrome://extensions/
      </text>
      <rect
        x="22"
        y="98"
        width="276"
        height="26"
        rx="4"
        fill="#f9fafb"
        stroke="#e5e7eb"
      />
      <text
        x="160"
        y="115"
        fontSize="11"
        fill="#6b7280"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        Page Extensions de Chrome
      </text>
    </svg>
  );
}
