'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  'Tous',
  'Inspiration',
  'Guide',
  'Tendance',
  'Manifeste',
  'Matière',
];

interface JournalCategoryFilterProps {
  activeCategory: string;
}

export function JournalCategoryFilter({
  activeCategory,
}: JournalCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'Tous') {
      params.delete('categorie');
    } else {
      params.set('categorie', cat);
    }
    router.push(`/journal?${params.toString()}`);
  };

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      aria-label="Filtrer par catégorie"
    >
      {CATEGORIES.map(cat => {
        const isActive =
          cat === 'Tous' ? activeCategory === 'Tous' : activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => handleSelect(cat)}
            className={[
              'font-dm-sans whitespace-nowrap rounded-none border px-4 py-2 text-xs uppercase tracking-widest transition-colors',
              isActive
                ? 'border-[#C9A961] bg-[#C9A961] text-[#1d1d1b]'
                : 'border-[#9B9B98] bg-transparent text-[#9B9B98] hover:border-[#1d1d1b] hover:text-[#1d1d1b]',
            ].join(' ')}
            aria-current={isActive ? 'true' : undefined}
          >
            {cat}
          </button>
        );
      })}
    </nav>
  );
}
