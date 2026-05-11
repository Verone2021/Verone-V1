import Link from 'next/link';

import { createClient } from '@supabase/supabase-js';

// Valeurs par défaut si la table site_content est vide ou inaccessible
const HERO_DEFAULTS = {
  title: "Un regard sur ce qui mérite d'être là",
  subtitle:
    'Déco et mobilier — mille pièces vues, cinquante retenues. Ce vase, cette lampe, ce bout de tissu. Pas un catalogue. Un regard.',
  cta_text: 'DÉCOUVRIR LA SÉLECTION',
  cta_link: '/catalogue',
  cta_secondary_text: 'NOS COLLECTIONS',
  cta_secondary_link: '/catalogue?view=collections',
} as const;

interface HeroContent {
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  image_url?: string | null;
}

async function fetchHeroContent(): Promise<HeroContent> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from('site_content')
      .select('content_value')
      .eq('content_key', 'hero')
      .single();

    if (!data?.content_value) return {};
    return data.content_value as HeroContent;
  } catch {
    // Silently fall back to defaults if the table is empty or unreachable
    return {};
  }
}

export async function HeroSection() {
  const cms = await fetchHeroContent();

  const title = cms.title ?? HERO_DEFAULTS.title;
  const subtitle = cms.subtitle ?? HERO_DEFAULTS.subtitle;
  const ctaText = cms.cta_text ?? HERO_DEFAULTS.cta_text;
  const ctaLink = cms.cta_link ?? HERO_DEFAULTS.cta_link;
  const ctaSecondaryText =
    cms.cta_secondary_text ?? HERO_DEFAULTS.cta_secondary_text;
  const ctaSecondaryLink =
    cms.cta_secondary_link ?? HERO_DEFAULTS.cta_secondary_link;

  return (
    <section className="flex min-h-[90vh] flex-col items-center justify-center bg-verone-white px-6 py-24 md:px-16 md:py-24">
      <div className="flex max-w-[1000px] flex-col items-center gap-8 text-center">
        <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl md:text-xs">
          SÉLECTION ÉDITORIALE
        </span>

        <h1 className="max-w-[900px] font-bodoni text-[44px] font-black leading-[1.04] text-verone-charbon sm:text-5xl md:text-7xl lg:text-[96px]">
          {title}
        </h1>

        <p className="max-w-[480px] font-montserrat text-base font-light leading-[1.7] text-verone-pearl md:text-[17px]">
          {subtitle}
        </p>

        <div className="mt-4 flex flex-col items-stretch gap-4 sm:mt-8 sm:flex-row sm:items-center">
          <Link
            href={ctaLink}
            className="group relative inline-flex items-center justify-center border border-verone-charbon bg-verone-charbon px-8 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961]"
          >
            {ctaText}
          </Link>

          <Link
            href={ctaSecondaryLink}
            className="inline-flex items-center justify-center border border-verone-or bg-transparent px-8 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-or transition-all duration-[180ms] ease-editorial hover:bg-verone-or hover:text-verone-charbon"
          >
            {ctaSecondaryText}
          </Link>
        </div>
      </div>
    </section>
  );
}
