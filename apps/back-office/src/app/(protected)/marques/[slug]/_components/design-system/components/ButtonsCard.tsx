'use client';

import { PreviewCard } from '../_PreviewCard';

const baseBtn: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 500,
  fontSize: 13,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  padding: '14px 28px',
  cursor: 'pointer',
};

export function ButtonsCard() {
  return (
    <PreviewCard label="Boutons">
      <div className="space-y-4 bg-white p-5">
        <Row note="Primary · default · hover (border or)">
          <button
            type="button"
            style={{
              ...baseBtn,
              background: '#1d1d1b',
              color: '#FFFFFF',
              border: '1px solid #1d1d1b',
            }}
          >
            Ajouter au panier
          </button>
          <button
            type="button"
            style={{
              ...baseBtn,
              background: '#1d1d1b',
              color: '#FFFFFF',
              border: '1px solid #C9A961',
              boxShadow: 'inset 0 0 0 1px #C9A961',
            }}
          >
            Ajouter au panier
          </button>
        </Row>
        <Row note="Secondary outline or · default · hover (filled)">
          <button
            type="button"
            style={{
              ...baseBtn,
              background: 'transparent',
              color: '#C9A961',
              border: '1px solid #C9A961',
            }}
          >
            Découvrir
          </button>
          <button
            type="button"
            style={{
              ...baseBtn,
              background: '#C9A961',
              color: '#1d1d1b',
              border: '1px solid #C9A961',
            }}
          >
            Découvrir
          </button>
        </Row>
        <Row note="Ghost · default · hover or">
          <a
            style={{
              ...baseBtn,
              color: '#1d1d1b',
              textDecoration: 'underline',
              textUnderlineOffset: 6,
              textDecorationThickness: 1,
              padding: 0,
            }}
          >
            Voir la collection
          </a>
          <a
            style={{
              ...baseBtn,
              color: '#C9A961',
              textDecoration: 'underline',
              textUnderlineOffset: 6,
              padding: 0,
            }}
          >
            Voir la collection
          </a>
        </Row>
      </div>
    </PreviewCard>
  );
}

function Row({ children, note }: { children: React.ReactNode; note: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {children}
      <span className="text-[11px] text-muted-foreground">{note}</span>
    </div>
  );
}
