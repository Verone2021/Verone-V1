'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Card, CardContent } from '@verone/ui/components/ui/card';
import { Badge } from '@verone/ui/components/ui/badge';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { createClient } from '@verone/utils/supabase/client';
import { ChevronRight, Sparkles } from 'lucide-react';

interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand_color: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

const FALLBACK_COLORS: Record<string, string> = {
  verone: '#6b7280',
  boemia: '#a16207',
  solar: '#1e293b',
  flos: '#15803d',
};

export default function MarquesIndexPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    void supabase
      .from('brands')
      .select(
        'id, slug, name, description, brand_color, logo_url, website_url, is_active, display_order'
      )
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[MarquesIndex] load brands error:', error);
        } else {
          setBrands((data ?? []) as Brand[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Marques</h1>
        <p className="text-sm text-muted-foreground">
          Le groupe Vérone gère plusieurs marques internes. Chacune aura sa
          propre identité visuelle, son site, ses canaux et son design system.
        </p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {!loading && brands.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune marque active configurée pour l'instant.
        </p>
      )}

      {brands.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {brands.map(brand => {
            const accent =
              brand.brand_color ?? FALLBACK_COLORS[brand.slug] ?? '#475569';
            return (
              <Link
                key={brand.id}
                href={`/marques/${brand.slug}`}
                className="block focus:outline-none"
              >
                <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: accent }}
                  />
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div className="flex flex-1 items-start gap-4">
                      {brand.logo_url ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          <CloudflareImage
                            cloudflareId={null}
                            fallbackSrc={brand.logo_url}
                            alt={`Logo ${brand.name}`}
                            fill
                            className="object-contain"
                            variant="public"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-base font-semibold text-white"
                          style={{ backgroundColor: accent }}
                        >
                          {brand.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold">
                            {brand.name}
                          </h2>
                          <Badge variant="outline" className="text-[10px]">
                            {brand.slug}
                          </Badge>
                        </div>
                        {brand.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {brand.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 pt-1 text-[11px] text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          Page bientôt enrichie (design system, canaux,
                          analytics)
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
