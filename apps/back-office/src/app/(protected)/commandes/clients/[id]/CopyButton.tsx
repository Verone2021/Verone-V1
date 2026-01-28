'use client';

import { useState } from 'react';

import { Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Copier' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={() => {
        void handleCopy().catch((error: unknown) => {
          console.error('[CopyButton] Copy failed:', error);
        });
      }}
      className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1"
      title={`Copier ${label.toLowerCase()}`}
    >
      <Copy className="h-3 w-3" />
      {copied ? '✓ Copié !' : label}
    </button>
  );
}
