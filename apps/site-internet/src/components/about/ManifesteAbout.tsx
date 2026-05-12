/**
 * ManifesteAbout — Section 3 de la page /a-propos
 *
 * 3 valeurs séparées par des filets verticaux (desktop) / horizontaux
 * (mobile). Direction artistique éditoriale Stitch : pas d'icônes,
 * pas d'encadrés, juste typo + filets fins pearl-soft.
 */
const VALEURS = [
  {
    number: '01',
    title: 'Le regard',
    body: 'On ne vend pas tout. On sélectionne ce qui a quelque chose à dire — une forme, une matière, une façon de tenir la lumière.',
  },
  {
    number: '02',
    title: 'La source directe',
    body: "On travaille en direct avec les marques et les ateliers. Pas d'intermédiaire. La qualité arrive sans le surcoût.",
  },
  {
    number: '03',
    title: 'Le temps long',
    body: "On ne suit pas les tendances. On choisit ce qui tient — dans le temps, dans l'espace, dans la tête.",
  },
  {
    number: '04',
    title: 'La relation',
    body: "Nos clients reviennent. Pas par habitude — parce qu'ils savent que ce qu'ils trouveront ici a été pensé pour eux.",
  },
] as const;

export function ManifesteAbout() {
  return (
    <section className="flex w-full flex-col items-center bg-verone-white px-6 py-24 md:px-16 md:py-32">
      {/* Eyebrow */}
      <div className="mb-12 text-center md:mb-16">
        <span className="font-dm-sans text-[12px] font-light uppercase tracking-[0.32em] text-verone-pearl">
          CE QUI NOUS GUIDE
        </span>
      </div>

      {/* 3 colonnes desktop / 1 colonne mobile */}
      <div className="grid w-full max-w-[1440px] grid-cols-1 md:grid-cols-3">
        {VALEURS.map((valeur, index) => {
          const isLast = index === VALEURS.length - 1;
          return (
            <div
              key={valeur.number}
              className={`flex flex-col px-6 py-8 md:px-12 md:py-4 ${
                isLast
                  ? 'border-b border-verone-pearl-soft md:border-b-0'
                  : 'border-b border-verone-pearl-soft md:border-b-0 md:border-r'
              } ${
                index === 0
                  ? 'border-t border-verone-pearl-soft md:border-t-0'
                  : ''
              }`}
            >
              <span className="mb-4 font-dm-sans text-[11px] font-light uppercase tracking-[0.2em] text-verone-pearl">
                {valeur.number}
              </span>
              <h3 className="mb-5 font-bodoni text-[28px] font-black leading-tight text-verone-charbon">
                {valeur.title}
              </h3>
              <p className="font-montserrat text-[15px] font-normal leading-[1.75] text-verone-pearl">
                {valeur.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
