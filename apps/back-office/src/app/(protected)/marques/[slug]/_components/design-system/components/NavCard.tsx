'use client';

import { PreviewCard } from '../_PreviewCard';

const SYMBOL_WHITE_ON_CHARCOAL =
  '/brand/verone/verone-symbol-white-on-black.jpg';

export function NavCard() {
  return (
    <PreviewCard label="Top nav — charbon, logo gauche, 5 items max">
      <div
        style={{
          background: '#1d1d1b',
          color: '#FFFFFF',
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SYMBOL_WHITE_ON_CHARCOAL}
          alt="V"
          style={{ height: 32, width: 'auto', filter: 'contrast(1.1)' }}
        />
        <nav
          style={{
            display: 'flex',
            gap: 36,
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 12,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
          }}
        >
          <a style={{ color: '#FFFFFF' }}>Mobilier</a>
          <a
            style={{
              color: '#C9A961',
              textDecoration: 'underline',
              textUnderlineOffset: 6,
              textDecorationThickness: 1,
            }}
          >
            Lumière
          </a>
          <a style={{ color: '#FFFFFF' }}>Objets</a>
          <a style={{ color: '#FFFFFF' }}>Éditions</a>
          <a style={{ color: '#FFFFFF' }}>Journal</a>
        </nav>
        <div
          style={{
            display: 'flex',
            gap: 18,
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: '#FFFFFF' }}>Recherche</span>
          <span style={{ color: '#FFFFFF' }}>Panier · 2</span>
        </div>
      </div>
      <p className="px-4 py-2 text-[11px] text-muted-foreground">
        Hover or souligné · monogramme V/A à gauche
      </p>
    </PreviewCard>
  );
}
