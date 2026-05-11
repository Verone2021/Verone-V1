'use client';

import { useState } from 'react';

import { Share2, Link2, Facebook } from 'lucide-react';

interface ArticleShareBarProps {
  slug: string;
}

export function ArticleShareBar({ slug }: ArticleShareBarProps) {
  const [copied, setCopied] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';
  const articleUrl = `${siteUrl}/journal/${slug}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(articleUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-4 border-y border-[#E6E5E2] py-4">
      <Share2 className="h-4 w-4 shrink-0 text-[#9B9B98]" />
      <span className="font-dm-sans text-[11px] uppercase tracking-widest text-[#9B9B98]">
        Partager
      </span>

      <button
        onClick={handleFacebookShare}
        className="flex h-9 w-9 items-center justify-center border border-[#E6E5E2] text-[#9B9B98] transition-colors hover:border-[#1d1d1b] hover:text-[#1d1d1b]"
        aria-label="Partager sur Facebook"
        title="Partager sur Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>

      <button
        onClick={handleCopyLink}
        className="flex h-9 w-9 items-center justify-center border border-[#E6E5E2] text-[#9B9B98] transition-colors hover:border-[#1d1d1b] hover:text-[#1d1d1b]"
        aria-label={copied ? 'Lien copié !' : 'Copier le lien'}
        title={copied ? 'Lien copié !' : 'Copier le lien'}
      >
        <Link2 className="h-4 w-4" />
      </button>

      {copied && (
        <span className="font-dm-sans text-[11px] text-[#C9A961] uppercase tracking-widest">
          Lien copié !
        </span>
      )}
    </div>
  );
}
