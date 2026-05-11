export function HeroAbout() {
  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center bg-verone-charbon px-6 py-24 md:px-16 md:py-32">
      <article className="flex w-full max-w-[800px] flex-col items-center gap-12 text-center">
        <span className="font-dm-sans text-[12px] font-light uppercase tracking-[0.32em] text-verone-or">
          Notre histoire
        </span>

        <h1 className="font-bodoni text-4xl font-black leading-[1.04] text-verone-white md:text-[72px]">
          Un regard sur ce qui mérite d&apos;être là
        </h1>

        <p className="max-w-[560px] font-montserrat text-[17px] font-light leading-[1.7] text-verone-pearl">
          Vérone ne vend pas des objets. Vérone choisit des pièces. Mille vues,
          cinquante retenues. Pas un algorithme, pas une tendance. Un regard.
        </p>
      </article>
    </section>
  );
}
