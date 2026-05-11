export function StorytellingAbout() {
  return (
    <section className="flex min-h-screen w-full flex-col items-stretch bg-verone-white md:flex-row md:py-0">
      {/* Colonne gauche : photo éditoriale (55%) */}
      <div className="relative h-[400px] w-full bg-verone-pearl-soft sm:h-[512px] md:h-auto md:min-h-[600px] md:w-[55%]">
        {/* Photo à uploader : textures travertin / chêne — fallback fond pearl-soft */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
            Photo éditoriale à venir
          </span>
        </div>
      </div>

      {/* Colonne droite : prose narrative (45%) */}
      <div className="flex w-full items-center justify-center px-6 py-16 md:w-[45%] md:px-16 md:py-24 lg:px-24">
        <div className="flex max-w-md flex-col gap-8 font-montserrat text-[17px] font-normal leading-[1.7] text-verone-charbon">
          <p>
            Chez Vérone, nous ne croyons pas à l&apos;accumulation. Nous croyons
            à la résonance. Chaque objet qui entre dans notre sélection a été
            scruté, touché, éprouvé. Il doit posséder cette âme silencieuse qui
            transforme un espace en lieu de vie.
          </p>
          <p>
            Notre quête nous mène des carrières de travertin de Toscane aux
            ateliers de menuiserie du Jura. Nous privilégions le temps long et
            le geste juste. Pas de tendances éphémères, mais des pièces qui
            s&apos;ennoblissent avec les années.
          </p>
          <p>
            C&apos;est cette exigence qui définit notre regard. Un luxe qui ne
            s&apos;affiche pas, mais qui se ressent. Une certaine idée de
            l&apos;intérieur, faite de vide et de présence.
          </p>
        </div>
      </div>
    </section>
  );
}
