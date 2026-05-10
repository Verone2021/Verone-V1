import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="flex min-h-[90vh] flex-col items-center justify-center bg-verone-white px-6 py-24 md:px-16 md:py-24">
      <div className="flex max-w-[1000px] flex-col items-center gap-8 text-center">
        <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl md:text-xs">
          Sélection éditoriale
        </span>

        <h1 className="max-w-[900px] font-bodoni text-[44px] font-black leading-[1.04] text-verone-charbon sm:text-5xl md:text-7xl lg:text-[96px]">
          Un regard sur ce qui mérite d&apos;être là
        </h1>

        <p className="max-w-[480px] font-montserrat text-base font-light leading-[1.7] text-verone-pearl md:text-[17px]">
          Déco et mobilier — mille pièces vues, cinquante retenues. Ce vase,
          cette lampe, ce bout de tissu. Pas un catalogue. Un regard.
        </p>

        <div className="mt-4 flex flex-col items-stretch gap-4 sm:mt-8 sm:flex-row sm:items-center">
          <Link
            href="/catalogue"
            className="group relative inline-flex items-center justify-center border border-verone-charbon bg-verone-charbon px-8 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961]"
          >
            Découvrir la sélection
          </Link>

          <Link
            href="/catalogue?view=collections"
            className="inline-flex items-center justify-center border border-verone-or bg-transparent px-8 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-or transition-all duration-[180ms] ease-editorial hover:bg-verone-or hover:text-verone-charbon"
          >
            Nos collections
          </Link>
        </div>
      </div>
    </section>
  );
}
