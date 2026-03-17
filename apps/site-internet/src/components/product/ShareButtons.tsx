'use client';

import { useState } from 'react';

import { Check, Copy, Facebook, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  imageUrl?: string | null;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-verone-gray-400 mr-1">
        <Share2 className="h-3.5 w-3.5 inline" /> Partager
      </span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-verone-gray-400 hover:text-verone-black transition-colors"
        aria-label="Partager sur Facebook"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-verone-gray-400 hover:text-verone-black transition-colors"
        aria-label="Épingler sur Pinterest"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-current"
          aria-hidden="true"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        className="p-1.5 text-verone-gray-400 hover:text-verone-black transition-colors"
        aria-label="Copier le lien"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
