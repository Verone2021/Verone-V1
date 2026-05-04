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

import { BrandSection } from './design-system/BrandSection';
import { ColorsSection } from './design-system/ColorsSection';
import { TypographySection } from './design-system/TypographySection';
import { ComponentsSection } from './design-system/ComponentsSection';
import { SpacingSection } from './design-system/SpacingSection';

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
            Design system — {tokens.meta.label}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {BRAND_LABELS[slug]} · jour
          </Badge>
        </div>
        {tokens.meta.tagline && (
          <p className="mt-1 text-xs italic text-muted-foreground">
            {tokens.meta.tagline}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-xs text-muted-foreground">
          Recréation pixel-fidèle des 24 cartes du design system livré sur
          claude.ai/design. Lecture seule — modifiable uniquement via le code
          (Claude Code).
        </p>

        <div style={cssVars} className="space-y-10">
          <BrandSection />
          <ColorsSection tokens={tokens} />
          <TypographySection tokens={tokens} />
          <ComponentsSection />
          <SpacingSection />
        </div>
      </CardContent>
    </Card>
  );
}
