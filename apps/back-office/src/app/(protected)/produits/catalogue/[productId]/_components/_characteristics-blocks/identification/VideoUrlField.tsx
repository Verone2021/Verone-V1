'use client';

import { useState } from 'react';

import { ExternalLink, Video } from 'lucide-react';

import { InlineTextField } from './InlineTextField';

export interface VideoUrlFieldProps {
  videoUrl: string | null;
  onSave: (url: string | null) => void;
}

export function VideoUrlField({ videoUrl, onSave }: VideoUrlFieldProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
          Vidéo produit
        </span>
        {videoUrl && (
          <button
            onClick={() => setPreview(v => !v)}
            className="flex items-center gap-1 text-[10px] text-indigo-600 hover:underline"
          >
            <Video className="h-3 w-3" />
            {preview ? 'Masquer' : 'Aperçu'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <InlineTextField
            label=""
            value={videoUrl ?? ''}
            placeholder="https://youtu.be/..."
            onSave={v => onSave(v || null)}
          />
        </div>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-700"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {preview && videoUrl && (
        <div className="mt-2 p-2 bg-neutral-50 rounded border border-neutral-200 text-[10px] text-neutral-500 italic">
          Aperçu vidéo non disponible dans l&apos;éditeur — ouvrir le lien
          externe.
        </div>
      )}
    </div>
  );
}
