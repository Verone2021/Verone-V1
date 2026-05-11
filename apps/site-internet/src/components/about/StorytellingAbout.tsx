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
            Il y a une ville en Italie où les plus grands créateurs de mobilier
            du monde viennent se faire juger.
            <br />
            Pas candidater. Juger.
          </p>
          <p>
            À Vérone, on n&apos;entre pas parce qu&apos;on a rempli un dossier.
            On entre parce que quelqu&apos;un a regardé, a pris le temps, et a
            décidé que ça méritait d&apos;être là. Le reste n&apos;entre pas.
          </p>
          <p>
            Tu sais reconnaître une belle pièce quand tu en vois une. Ce
            n&apos;est pas une question d&apos;expertise — c&apos;est physique.
            La matière, la proportion, ce que l&apos;objet fait à l&apos;espace
            rien qu&apos;en étant là. Tu le sais avant même de comprendre
            pourquoi.
          </p>
          <p>Le problème, c&apos;est de la trouver.</p>
          <p>
            Dix mille références pour en repérer trois qui méritent
            d&apos;exister. Les bonnes adresses supposent un budget sans
            contrainte. Entre les deux, personne n&apos;avait décidé de faire
            vraiment le travail.
          </p>
          <p>Vérone est née de cette absence.</p>
          <p>
            On regarde mille pièces. Ce vase qui change une table rien
            qu&apos;en y étant posé. Ce bout de tissu qui donne chaud rien
            qu&apos;à le regarder. Cette lampe dont tu ne comprends pas tout de
            suite pourquoi tu ne peux pas t&apos;en détacher. Sur mille pièces
            vues, cinquante entrent. Les autres non — pas parce qu&apos;elles
            sont mauvaises, parce qu&apos;elles n&apos;ont rien à dire.
          </p>
          <p>Ce n&apos;est pas un catalogue. C&apos;est un regard.</p>
          <p>Et ce regard, on te le prête.</p>
        </div>
      </div>
    </section>
  );
}
