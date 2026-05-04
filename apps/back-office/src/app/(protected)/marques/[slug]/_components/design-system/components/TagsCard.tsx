'use client';

import { PreviewCard } from '../_PreviewCard';

const baseTag: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 10,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  padding: '6px 14px',
  borderRadius: 999,
};

export function TagsCard() {
  return (
    <PreviewCard label="Tags · Badges">
      <div className="flex flex-wrap items-center gap-2 bg-white p-4">
        <span
          style={{ ...baseTag, color: '#C9A961', border: '1px solid #C9A961' }}
        >
          Édition limitée
        </span>
        <span
          style={{ ...baseTag, color: '#1d1d1b', border: '1px solid #1d1d1b' }}
        >
          Sourcé Italie
        </span>
        <span style={{ ...baseTag, color: '#FFFFFF', background: '#1d1d1b' }}>
          Nouveau
        </span>
        <span style={{ ...baseTag, color: '#1d1d1b', background: '#C9A961' }}>
          Pièce unique
        </span>
        <span
          style={{ ...baseTag, color: '#9B9B98', border: '1px solid #E6E5E2' }}
        >
          Sur rendez-vous
        </span>
      </div>
    </PreviewCard>
  );
}
