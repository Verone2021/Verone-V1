'use client';

import { useState } from 'react';

import Link from 'next/link';

import { X } from 'lucide-react';

import { useBannerContent } from '@/hooks/use-site-content';

export function PromoBanner() {
  const { data: banner } = useBannerContent();
  const [dismissed, setDismissed] = useState(false);

  if (!banner || !banner.enabled || dismissed) return null;

  return (
    <div
      className="relative flex items-center justify-center px-4 py-2.5 text-center"
      style={{
        backgroundColor: banner.bg_color || '#1a1a1a',
        color: banner.text_color || '#ffffff',
      }}
    >
      {banner.link ? (
        <Link
          href={banner.link}
          className="text-sm font-medium hover:underline"
        >
          {banner.text}
        </Link>
      ) : (
        <span className="text-sm font-medium">{banner.text}</span>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Fermer le bandeau"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
