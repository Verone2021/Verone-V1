'use client';

import { useMemo } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Badge } from '@verone/ui/components/ui/badge';
import {
  BRAND_LABELS,
  buildCssVarObject,
  themeRegistry,
  type BrandSlug,
  type BrandTokens,
} from '@verone/themes';
import { Palette } from 'lucide-react';

interface Props {
  slug: string;
}

export function DesignSystemPreview({ slug }: Props) {
  const brandSlug = slug as BrandSlug;
  const tokens = themeRegistry[brandSlug] ?? null;

  if (!tokens) {
    return <PlaceholderState slug={slug} />;
  }

  return <FilledState slug={brandSlug} tokens={tokens} />;
}

function PlaceholderState({ slug }: { slug: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Palette className="h-4 w-4" />
          Design system
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Aucun design system n&apos;est encore défini pour{' '}
          <strong>{slug}</strong>. La marque attend ses tokens (palette,
          typographies, ombres) — à générer sur claude.ai/design puis à intégrer
          dans le code.
        </p>
      </CardContent>
    </Card>
  );
}

function FilledState({
  slug,
  tokens,
}: {
  slug: BrandSlug;
  tokens: BrandTokens;
}) {
  const cssVars = useMemo(
    () => buildCssVarObject(tokens, 'day') as React.CSSProperties,
    [tokens]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="h-4 w-4" />
            Design system
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {BRAND_LABELS[slug]} · jour
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-muted-foreground">
          Tokens consommés par l&apos;app de la marque (couleurs, typo, ombres,
          arrondis). Lecture seule — modifiable uniquement via le code (Claude
          Code).
        </p>

        <div style={cssVars} className="space-y-6">
          <PaletteBlock tokens={tokens} />
          <TypographyBlock tokens={tokens} />
          <ButtonsBlock tokens={tokens} />
          <ElevationBlock tokens={tokens} />
          {tokens.signature?.damierCell && <DamierBlock />}
          {tokens.colorsNight && <NightModeBlock tokens={tokens} />}
        </div>
      </CardContent>
    </Card>
  );
}

function PaletteBlock({ tokens }: { tokens: BrandTokens }) {
  const swatches = [
    { label: 'Primary', value: tokens.colors.primary },
    { label: 'Secondary', value: tokens.colors.secondary },
    { label: 'Accent', value: tokens.colors.accent },
    { label: 'Background', value: tokens.colors.background },
    { label: 'Foreground', value: tokens.colors.foreground },
    { label: 'Muted', value: tokens.colors.backgroundMuted },
    { label: 'Border', value: tokens.colors.border },
    { label: 'Destructive', value: tokens.colors.destructive },
  ];
  const named = tokens.brandColors
    ? Object.entries(tokens.brandColors).map(([k, v]) => ({
        label: k,
        value: v,
      }))
    : [];

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Palette
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {swatches.map(s => (
          <Swatch key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
      {named.length > 0 && (
        <>
          <h4 className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Nominatives marque
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {named.map(s => (
              <Swatch key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <div className="h-12 w-full" style={{ backgroundColor: value }} />
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-medium capitalize">{label}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function TypographyBlock({ tokens }: { tokens: BrandTokens }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Typographie
      </h3>
      <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
        <div
          style={{
            fontFamily: tokens.typography.fontDisplay,
            fontSize: '32px',
            letterSpacing: tokens.typography.tracking.display,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          DISPLAY
        </div>
        <div
          style={{
            fontFamily: tokens.typography.fontHeading,
            fontSize: tokens.typography.scale.h2,
            lineHeight: tokens.typography.lineHeight.tight,
          }}
        >
          Titre éditorial — heading
        </div>
        <div
          style={{
            fontFamily: tokens.typography.fontBody,
            fontSize: tokens.typography.scale.body,
            lineHeight: tokens.typography.lineHeight.body,
          }}
        >
          Corps de texte — sourcé en Italie · 8 pièces · livraison sur
          rendez-vous. La marque parle au présent, sans jargon.
        </div>
        <div
          style={{
            fontFamily: tokens.typography.fontBody,
            fontSize: tokens.typography.scale.eyebrow,
            letterSpacing: tokens.typography.tracking.eyebrow,
            textTransform: 'uppercase',
            color: tokens.colors.foregroundMuted,
            fontWeight: 500,
          }}
        >
          Eyebrow / kicker
        </div>
      </div>
    </section>
  );
}

function ButtonsBlock({ tokens }: { tokens: BrandTokens }) {
  const baseBtn: React.CSSProperties = {
    fontFamily: tokens.typography.fontBody,
    fontSize: tokens.typography.scale.bodySm,
    letterSpacing: tokens.typography.tracking.button,
    textTransform: 'uppercase',
    padding: '12px 24px',
    minHeight: 44,
    borderRadius: tokens.radius.none,
    cursor: 'pointer',
    border: '1px solid transparent',
    fontWeight: 500,
  };

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Boutons
      </h3>
      <div className="flex flex-wrap gap-3 rounded-md border border-gray-200 bg-white p-4">
        <button
          type="button"
          style={{
            ...baseBtn,
            background: tokens.colors.primary,
            color: tokens.colors.primaryForeground,
            borderColor: tokens.colors.primary,
          }}
        >
          Primary
        </button>
        <button
          type="button"
          style={{
            ...baseBtn,
            background: 'transparent',
            color: tokens.colors.accent,
            borderColor: tokens.colors.accent,
          }}
        >
          Secondary
        </button>
        <button
          type="button"
          style={{
            ...baseBtn,
            background: 'transparent',
            color: tokens.colors.foreground,
            borderColor: 'transparent',
            textDecoration: 'underline',
            textUnderlineOffset: 6,
            padding: '12px 0',
          }}
        >
          Ghost
        </button>
      </div>
    </section>
  );
}

function ElevationBlock({ tokens }: { tokens: BrandTokens }) {
  const items: { label: string; shadow: string }[] = [
    { label: 'sm', shadow: tokens.shadows.sm },
    { label: 'md', shadow: tokens.shadows.md },
    { label: 'lg', shadow: tokens.shadows.lg },
    { label: 'xl', shadow: tokens.shadows.xl },
  ];
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Ombres
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(i => (
          <div
            key={i.label}
            className="flex items-center justify-center rounded-md bg-white p-4 text-xs font-medium"
            style={{ boxShadow: i.shadow, color: tokens.colors.foreground }}
          >
            {i.label}
          </div>
        ))}
      </div>
    </section>
  );
}

function DamierBlock() {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Motif signature — damier or sur charbon
      </h3>
      <div
        className="h-24 w-full rounded-md"
        style={{
          backgroundImage: `linear-gradient(45deg, var(--color-gold) 25%, transparent 25%), linear-gradient(-45deg, var(--color-gold) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-gold) 75%), linear-gradient(-45deg, transparent 75%, var(--color-gold) 75%)`,
          backgroundSize:
            'calc(var(--damier-cell) * 2) calc(var(--damier-cell) * 2)',
          backgroundPosition:
            '0 0, 0 var(--damier-cell), var(--damier-cell) calc(-1 * var(--damier-cell)), calc(-1 * var(--damier-cell)) 0',
          backgroundColor: 'var(--color-charcoal)',
        }}
      />
    </section>
  );
}

function NightModeBlock({ tokens }: { tokens: BrandTokens }) {
  if (!tokens.colorsNight) return null;
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Mode nuit
      </h3>
      <div
        className="rounded-md p-5"
        style={{
          backgroundColor: tokens.colorsNight.background,
          color: tokens.colorsNight.foreground,
        }}
      >
        <p
          style={{
            fontFamily: tokens.typography.fontHeading,
            fontSize: tokens.typography.scale.h4,
            lineHeight: tokens.typography.lineHeight.snug,
            margin: 0,
          }}
        >
          Hero · footer · modals premium
        </p>
        <p
          style={{
            fontFamily: tokens.typography.fontBody,
            fontSize: tokens.typography.scale.bodySm,
            color: tokens.colorsNight.foregroundMuted,
            marginTop: 8,
          }}
        >
          Fond charbon, texte blanc, accent or préservé.
        </p>
      </div>
    </section>
  );
}
