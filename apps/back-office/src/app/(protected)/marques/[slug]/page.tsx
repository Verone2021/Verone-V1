'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@verone/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Badge } from '@verone/ui/components/ui/badge';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Megaphone,
  Sparkles,
} from 'lucide-react';

import { DesignSystemPreview } from './_components/DesignSystemPreview';

interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand_color: string | null;
  logo_url: string | null;
  website_url: string | null;
  social_handles: Record<string, string> | null;
  is_active: boolean;
}

const FALLBACK_COLORS: Record<string, string> = {
  verone: '#6b7280',
  boemia: '#a16207',
  solar: '#1e293b',
  flos: '#15803d',
};

interface UpcomingSection {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const UPCOMING_SECTIONS: UpcomingSection[] = [
  {
    icon: Layers,
    title: 'Catalogue produits',
    description:
      'Liste filtrable des produits rattachés à cette marque (via brand_ids).',
  },
  {
    icon: Megaphone,
    title: 'Canaux & publications',
    description:
      'Site dédié + comptes sociaux + statut de publication agrégé depuis la DAM.',
  },
  {
    icon: ImageIcon,
    title: 'Bibliothèque',
    description:
      'Filtre direct sur la DAM pour ne voir que les photos taggées avec cette marque.',
  },
];

export default function MarqueDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();
    let cancelled = false;
    void supabase
      .from('brands')
      .select(
        'id, slug, name, description, brand_color, logo_url, website_url, social_handles, is_active'
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[MarqueDetail] load brand error:', error);
        }
        if (!data) {
          setNotFoundFlag(true);
        } else {
          setBrand(data as Brand);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFoundFlag) {
    notFound();
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-sm text-muted-foreground md:p-6">
        Chargement…
      </div>
    );
  }

  if (!brand) return null;

  const accent = brand.brand_color ?? FALLBACK_COLORS[brand.slug] ?? '#475569';
  const socialEntries = brand.social_handles
    ? Object.entries(brand.social_handles).filter(([, v]) => Boolean(v))
    : [];

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <Link
        href="/marques"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Toutes les marques
      </Link>

      <header className="overflow-hidden rounded-lg border border-border">
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            {brand.logo_url ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <CloudflareImage
                  cloudflareId={null}
                  fallbackSrc={brand.logo_url}
                  alt={`Logo ${brand.name}`}
                  fill
                  className="object-contain"
                  variant="public"
                  sizes="64px"
                />
              </div>
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md text-lg font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {brand.name}
                </h1>
                <Badge variant="outline" className="text-[10px]">
                  {brand.slug}
                </Badge>
              </div>
              {brand.description && (
                <p className="text-sm text-muted-foreground">
                  {brand.description}
                </p>
              )}
            </div>
          </div>
          {brand.website_url && (
            <Button asChild variant="outline" size="sm">
              <a
                href={brand.website_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Site public
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </header>

      {socialEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2 text-xs">
              {socialEntries.map(([platform, handle]) => (
                <li
                  key={platform}
                  className="rounded-md border border-border bg-muted px-2 py-1"
                >
                  <span className="font-medium capitalize">{platform}</span>{' '}
                  <span className="text-muted-foreground">{handle}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <DesignSystemPreview slug={brand.slug} />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Bientôt enrichi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            La page détail de marque servira de cockpit central. Les sections
            suivantes seront livrées dans des sprints dédiés.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {UPCOMING_SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-medium">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
