'use client';

import Image from 'next/image';

import { ButtonV2 } from '@verone/ui';
import { FileText, Upload, Loader2, ArrowLeft } from 'lucide-react';

interface CustomerKbisCardProps {
  kbisUrl: string | null;
  kbisUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function CustomerKbisCard({
  kbisUrl,
  kbisUploading,
  onUpload,
}: CustomerKbisCardProps) {
  return (
    <div className="card-verone p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-black flex items-center">
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Extrait K-BIS
        </h3>
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                void onUpload(file).catch(err => {
                  console.error('[KbisUpload] failed:', err);
                });
              }
              e.target.value = '';
            }}
            disabled={kbisUploading}
          />
          <ButtonV2
            variant="outline"
            size="sm"
            asChild
            disabled={kbisUploading}
          >
            <span>
              {kbisUploading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              {kbisUrl ? 'Remplacer' : 'Deposer'}
            </span>
          </ButtonV2>
        </label>
      </div>
      {kbisUrl ? (
        <div className="space-y-2">
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            {kbisUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) ? (
              <Image
                src={kbisUrl}
                alt="K-BIS"
                width={400}
                height={300}
                className="w-full h-auto object-contain"
                unoptimized
              />
            ) : (
              <iframe
                src={kbisUrl}
                title="K-BIS"
                className="w-full h-[200px]"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={kbisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft className="h-3 w-3 rotate-[135deg]" />
              Telecharger
            </a>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic text-center py-2">
          Aucun K-BIS depose
        </p>
      )}
    </div>
  );
}
