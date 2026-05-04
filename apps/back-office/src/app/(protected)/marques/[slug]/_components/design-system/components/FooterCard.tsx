'use client';

import { PreviewCard } from '../_PreviewCard';

const SYMBOL_WHITE_ON_CHARCOAL =
  '/brand/verone/verone-symbol-white-on-black.jpg';

export function FooterCard() {
  return (
    <PreviewCard label="Footer — charbon, logo + 3 colonnes + mentions">
      <div style={{ background: '#1d1d1b', color: '#FFFFFF' }}>
        <div
          style={{
            padding: '36px 32px 18px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: 32,
          }}
        >
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SYMBOL_WHITE_ON_CHARCOAL}
              alt="V"
              style={{
                height: 36,
                width: 'auto',
                display: 'block',
                marginBottom: 14,
              }}
            />
            <div
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 12,
                lineHeight: 1.7,
                opacity: 0.85,
              }}
            >
              229 rue Saint-Honoré
              <br />
              75001 Paris
            </div>
          </div>
          <FooterCol
            title="Maison"
            items={['Mobilier', 'Lumière', 'Objets', 'Éditions']}
          />
          <FooterCol
            title="Contact"
            items={[
              'Sur rendez-vous',
              'contact@verone.fr',
              '+33 1 42 60 00 00',
            ]}
          />
        </div>
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.10)',
            padding: '14px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#9B9B98',
          }}
        >
          <span>© Vérone 2026</span>
          <span>Mentions · CGV · Confidentialité</span>
        </div>
      </div>
    </PreviewCard>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 11,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: '#C9A961',
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 12,
          lineHeight: 2.1,
          opacity: 0.85,
        }}
      >
        {items.map(i => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
