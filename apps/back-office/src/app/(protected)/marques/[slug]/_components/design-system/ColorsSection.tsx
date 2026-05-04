'use client';

import type { BrandTokens } from '@verone/themes';

import { PreviewCard } from './_PreviewCard';

export function ColorsSection({ tokens }: { tokens: BrandTokens }) {
  return (
    <section className="space-y-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Couleurs
      </h3>

      <PreviewCard label="Palette stricte — 3 couleurs">
        <div className="grid grid-cols-3 gap-4 p-4">
          <SwatchBlock
            label="Or"
            hex="#C9A961"
            note="Pantone Eur. Gold api 4007"
          />
          <SwatchBlock
            label="Charbon"
            hex="#1d1d1b"
            note="Pantone Black C — chaud"
          />
          <SwatchBlock
            label="Blanc"
            hex="#FFFFFF"
            note="Blanc pur lumineux"
            outlined
          />
        </div>
      </PreviewCard>

      <PreviewCard label="Or — variations + dégradé embossage">
        <div className="grid grid-cols-3 gap-4 p-4">
          <SwatchBlock label="Foncé" hex="#B8954A" note="Pressed" small />
          <SwatchBlock
            label="Médian"
            hex="#C9A961"
            note="Wordmark, accents"
            small
          />
          <SwatchBlock
            label="Clair"
            hex="#D4B86E"
            note="Highlight, embossage"
            small
          />
        </div>
        <div
          className="mx-4 mb-4 h-6"
          style={{
            background:
              'linear-gradient(90deg, #B8954A 0%, #C9A961 50%, #D4B86E 100%)',
          }}
        />
        <p className="px-4 pb-4 text-[11px] italic text-muted-foreground">
          Dégradé or — autorisé pour effet embossage uniquement.
        </p>
      </PreviewCard>

      <PreviewCard label="Mode jour vs mode nuit — mêmes 3 couleurs">
        <div className="grid grid-cols-2 gap-px bg-[#E6E5E2]">
          <ModePanel mode="jour" tokens={tokens} />
          <ModePanel mode="nuit" tokens={tokens} />
        </div>
        <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-muted-foreground">
          Mêmes 3 couleurs · réorganisées selon contexte.
        </p>
      </PreviewCard>

      <PreviewCard label="Outils UI — gris perle (jamais marque)">
        <div className="grid grid-cols-2 gap-4 p-4">
          <SwatchBlock
            label="Perle"
            hex="#9B9B98"
            note="Texte secondaire, disabled"
            small
          />
          <SwatchBlock
            label="Perle doux"
            hex="#E6E5E2"
            note="Bordures, dividers jour"
            small
            outlined
          />
        </div>
        <p className="px-4 pb-4 text-[11px] italic text-muted-foreground">
          Outil technique uniquement — jamais une couleur de marque.
        </p>
      </PreviewCard>
    </section>
  );
}

function SwatchBlock({
  label,
  hex,
  note,
  outlined,
  small,
}: {
  label: string;
  hex: string;
  note: string;
  outlined?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          height: small ? 88 : 96,
          background: hex,
          border: outlined ? '1px solid #E6E5E2' : 'none',
        }}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em]">
        <span>{label}</span>
        <span className="text-muted-foreground">{hex}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function ModePanel({
  mode,
  tokens,
}: {
  mode: 'jour' | 'nuit';
  tokens: BrandTokens;
}) {
  const isDay = mode === 'jour';
  const bg = isDay
    ? tokens.colors.background
    : (tokens.colorsNight?.background ?? '#1d1d1b');
  const fg = isDay
    ? tokens.colors.foreground
    : (tokens.colorsNight?.foreground ?? '#FFFFFF');

  return (
    <div style={{ background: bg, color: fg, padding: 24 }}>
      <span
        className="text-[11px] font-medium uppercase tracking-[0.32em]"
        style={{ color: '#9B9B98' }}
      >
        Mode {mode}
      </span>
      <h3
        className="mt-2"
        style={{
          fontFamily:
            '"Migra", "Bodoni Moda", "Playfair Display", Georgia, serif',
          fontWeight: 800,
          fontSize: 24,
          lineHeight: 1.1,
          color: fg,
          margin: '8px 0 6px',
        }}
      >
        Console Travertine
      </h3>
      <p
        style={{
          fontFamily: '"Montserrat", system-ui, sans-serif',
          fontSize: 12,
          color: fg,
          opacity: isDay ? 1 : 0.85,
          margin: '0 0 10px',
        }}
      >
        Sculptée à la main dans un atelier toscan.
      </p>
      <span
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#C9A961',
        }}
      >
        2 480 €
      </span>
    </div>
  );
}
