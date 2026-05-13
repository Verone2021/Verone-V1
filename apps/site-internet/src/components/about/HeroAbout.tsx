'use client';

import { useAboutHero } from '@/hooks/use-site-content';

const DEFAULT_TITLE_LINE_1 = 'Pas un catalogue.';
const DEFAULT_TITLE_LINE_2 = 'Un regard.';
const DEFAULT_SUBTITLE =
  "Mille pièces vues, cinquante retenues. Ce vase, cette lampe, ce bout de tissu. Vérone, c'est ça.";

export function HeroAbout() {
  const { data } = useAboutHero();
  const customTitle = data?.title?.trim();
  const customSubtitle = data?.subtitle?.trim();

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center bg-verone-charbon px-6 py-24 md:px-16 md:py-32">
      <article className="flex w-full max-w-[800px] flex-col items-center gap-12 text-center">
        <span className="font-dm-sans text-[12px] font-light uppercase tracking-[0.32em] text-verone-or">
          À PROPOS
        </span>

        <h1 className="font-bodoni text-4xl font-black leading-[1.04] text-verone-white md:text-[72px]">
          {customTitle ? (
            customTitle.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))
          ) : (
            <>
              {DEFAULT_TITLE_LINE_1}
              <br />
              {DEFAULT_TITLE_LINE_2}
            </>
          )}
        </h1>

        <p className="max-w-[560px] font-montserrat text-[17px] font-light leading-[1.7] text-verone-pearl">
          {customSubtitle ?? DEFAULT_SUBTITLE}
        </p>
      </article>
    </section>
  );
}
