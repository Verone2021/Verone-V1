import Link from 'next/link';

interface ArticleBreadcrumbProps {
  title: string;
}

export function ArticleBreadcrumb({ title }: ArticleBreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="py-4">
      <ol className="font-dm-sans flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-[#9B9B98]">
        <li>
          <Link href="/" className="hover:text-[#1d1d1b] transition-colors">
            Accueil
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href="/journal"
            className="hover:text-[#1d1d1b] transition-colors"
          >
            Journal
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li
          className="max-w-[200px] truncate text-[#1d1d1b] md:max-w-none"
          aria-current="page"
        >
          {title}
        </li>
      </ol>
    </nav>
  );
}
