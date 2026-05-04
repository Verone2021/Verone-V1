'use client';

import { PreviewCard } from './_PreviewCard';

const SPACING_STEPS = [4, 8, 12, 16, 24, 32, 48, 64, 96];

const SHADOWS = [
  {
    label: 'shadow-0',
    note: 'aucune',
    shadow: 'none',
    border: '1px solid #E6E5E2',
  },
  {
    label: 'shadow-1',
    note: 'hairline',
    shadow: '0 1px 0 0 rgba(29,29,27,0.06)',
  },
  {
    label: 'shadow-2',
    note: 'card hover',
    shadow: '0 12px 40px -16px rgba(29,29,27,0.18)',
  },
  {
    label: 'shadow-3',
    note: 'modal',
    shadow: '0 28px 80px -24px rgba(29,29,27,0.28)',
  },
];

export function SpacingSection() {
  return (
    <section className="space-y-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Espace · Arrondis · Élévation
      </h3>

      <PreviewCard label="Spacing — base 4px">
        <div className="flex items-end gap-4 bg-white p-5">
          {SPACING_STEPS.map(s => (
            <div key={s} className="text-center">
              <div
                style={{
                  width: s,
                  height: s,
                  background: '#1d1d1b',
                  margin: '0 auto 6px',
                }}
              />
              <div className="text-[10px]">{s}</div>
            </div>
          ))}
        </div>
        <p className="bg-gray-50/50 px-4 py-2 text-[11px] text-muted-foreground">
          Container 1440 · gutters 32 / 64 · breakpoints 375 / 768 / 1024 / 1440
          / 1920
        </p>
      </PreviewCard>

      <PreviewCard label="Radii — quasi nuls (la sobriété passe par l'angle droit)">
        <div className="flex flex-wrap items-center gap-6 bg-white p-5">
          <RadiusSwatch radius={0} label="0px" note="défaut" />
          <RadiusSwatch radius={1} label="1px" note="hairline forms" />
          <RadiusSwatch radius={2} label="2px" note="chips discrets" />
          <PillSwatch />
        </div>
      </PreviewCard>

      <PreviewCard label="Élévation — extrêmement retenue, préférer hairline à shadow">
        <div className="flex flex-wrap items-end justify-around gap-6 bg-white p-5">
          {SHADOWS.map(s => (
            <div key={s.label} className="text-center">
              <div
                style={{
                  width: 120,
                  height: 80,
                  background: '#FFFFFF',
                  boxShadow: s.shadow,
                  border: s.border,
                }}
              />
              <div className="mt-2 text-[11px] text-muted-foreground">
                {s.label}
                <br />
                {s.note}
              </div>
            </div>
          ))}
        </div>
        <p className="bg-gray-50/50 px-4 py-2 text-[11px] italic text-muted-foreground">
          Aucune ombre sur les boutons.
        </p>
      </PreviewCard>
    </section>
  );
}

function RadiusSwatch({
  radius,
  label,
  note,
}: {
  radius: number;
  label: string;
  note: string;
}) {
  return (
    <div className="text-center">
      <div
        style={{
          width: 72,
          height: 72,
          background: '#1d1d1b',
          borderRadius: radius,
        }}
      />
      <div className="mt-2 text-[11px] text-muted-foreground">
        {label}
        <br />
        {note}
      </div>
    </div>
  );
}

function PillSwatch() {
  return (
    <div className="text-center">
      <div
        style={{
          width: 140,
          height: 36,
          background: '#1d1d1b',
          borderRadius: 999,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        Pill
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        999px
        <br />
        tags / pills
      </div>
    </div>
  );
}
