import Image from 'next/image';
import Link from 'next/link';

import type { ProductBlock } from '@/lib/parse-article-body';

type ArticleProductEmbedProps = Omit<ProductBlock, 'type'>;

export function ArticleProductEmbed({
  name,
  slug,
  image,
  alt,
}: ArticleProductEmbedProps) {
  return (
    <aside className="my-10 border border-[#E6E5E2] bg-[#fafaf9]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {/* Image 4:5 */}
        <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#E6E5E2] sm:h-24 sm:w-20">
          <Image
            src={image}
            alt={alt}
            fill
            className="object-cover grayscale"
            sizes="80px"
          />
        </div>

        {/* Infos */}
        <div className="flex flex-1 flex-col gap-3">
          <p className="font-dm-sans text-[10px] uppercase tracking-widest text-[#9B9B98]">
            Produit présenté
          </p>
          <h4 className="font-bodoni text-lg text-[#1d1d1b]">{name}</h4>
          <Link
            href={`/produit/${slug}`}
            className="font-dm-sans inline-flex w-fit items-center gap-2 text-xs uppercase tracking-widest text-[#C9A961] underline underline-offset-4 hover:text-[#1d1d1b] transition-colors"
          >
            Voir le produit →
          </Link>
        </div>
      </div>
    </aside>
  );
}
