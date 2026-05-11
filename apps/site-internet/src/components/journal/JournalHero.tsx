/**
 * Hero de la page /journal
 * Fond charbon, H1 Bodoni, baseline Montserrat
 */

export function JournalHero() {
  return (
    <section className="bg-[#1d1d1b] px-4 py-16 text-center md:py-24">
      <p className="font-dm-sans mb-4 text-xs uppercase tracking-[0.2em] text-[#9B9B98]">
        Vérone — Concept Store
      </p>
      <h1 className="font-bodoni mb-6 text-5xl font-bold text-white md:text-7xl">
        Journal
      </h1>
      <p className="font-montserrat mx-auto max-w-md text-base text-[#9B9B98] md:text-lg">
        Idées, guides et tendances pour ton intérieur
      </p>
    </section>
  );
}
