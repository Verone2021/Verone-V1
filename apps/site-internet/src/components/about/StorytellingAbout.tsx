'use client';

import Image from 'next/image';

import {
  resolveImageUrl,
  useAboutHero,
  useAboutStory,
} from '@/hooks/use-site-content';

const DEFAULT_IMAGE =
  'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/f694f991-0994-4277-e1ae-63aec4d87700/public';

const DEFAULT_PARAGRAPHS = [
  'Il y a une ville en Italie où les plus grands créateurs de mobilier du monde viennent se faire juger.\nPas candidater. Juger.',
  "À Vérone, on n'entre pas parce qu'on a rempli un dossier. On entre parce que quelqu'un a regardé, a pris le temps, et a décidé que ça méritait d'être là. Le reste n'entre pas.",
  "Tu sais reconnaître une belle pièce quand tu en vois une. Ce n'est pas une question d'expertise — c'est physique. La matière, la proportion, ce que l'objet fait à l'espace rien qu'en étant là. Tu le sais avant même de comprendre pourquoi.",
  "Le problème, c'est de la trouver.",
  "Dix mille références pour en repérer trois qui méritent d'exister. Les bonnes adresses supposent un budget sans contrainte. Entre les deux, personne n'avait décidé de faire vraiment le travail.",
  'Vérone est née de cette absence.',
  "On regarde mille pièces. Ce vase qui change une table rien qu'en y étant posé. Ce bout de tissu qui donne chaud rien qu'à le regarder. Cette lampe dont tu ne comprends pas tout de suite pourquoi tu ne peux pas t'en détacher. Sur mille pièces vues, cinquante entrent. Les autres non — pas parce qu'elles sont mauvaises, parce qu'elles n'ont rien à dire.",
  "Ce n'est pas un catalogue. C'est un regard.",
  'Et ce regard, on te le prête.',
];

export function StorytellingAbout() {
  const { data: hero } = useAboutHero();
  const { data: story } = useAboutStory();

  const imageUrl = resolveImageUrl(hero?.image_url ?? null) ?? DEFAULT_IMAGE;
  const paragraphs =
    story?.paragraphs && story.paragraphs.length > 0
      ? story.paragraphs
      : DEFAULT_PARAGRAPHS;

  return (
    <section className="flex min-h-screen w-full flex-col items-stretch bg-verone-white md:flex-row md:py-0">
      {/* Colonne gauche : photo éditoriale (55%) */}
      <div className="relative h-[400px] w-full overflow-hidden bg-verone-pearl-soft sm:h-[512px] md:h-auto md:min-h-[600px] md:w-[55%]">
        <Image
          src={imageUrl}
          alt={hero?.subtitle ?? 'Vérone Collections — éditorial'}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 55vw"
        />
      </div>

      {/* Colonne droite : prose narrative (45%) */}
      <div className="flex w-full items-center justify-center px-6 py-16 md:w-[45%] md:px-16 md:py-24 lg:px-24">
        <div className="flex max-w-md flex-col gap-8 font-montserrat text-[17px] font-normal leading-[1.7] text-verone-charbon">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>
              {paragraph.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
